import { useQuery, useUpdateItem } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const TEST_PREFIX = 'postgrest-swr-update-item';

describe('useUpdateItem', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<string, unknown>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
  });

  beforeEach(() => {
    provider = new Map();
  });

  afterEach(cleanup);

  it('should update item in cache without HTTP request', async () => {
    const USERNAME = `${testRunPrefix}-cache-only`;
    const UPDATED_VALUE = 'cache-updated-value';

    // First insert a contact
    const { data: inserted } = await client
      .from('contact')
      .insert({ username: USERNAME })
      .select('id,username')
      .single();

    function Page() {
      const [updateComplete, setUpdateComplete] = useState(false);
      const { data } = useQuery({
        query: client
          .from('contact')
          .select('id,username')
          .eq('id', inserted!.id),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const updateItem = useUpdateItem({
        primaryKeys: ['id'],
        table: 'contact',
        schema: 'public',
      });

      return (
        <div>
          <span data-testid="username">{data?.[0]?.username ?? 'loading'}</span>
          <button
            data-testid="update"
            onClick={async () => {
              await updateItem({ id: inserted!.id, username: UPDATED_VALUE });
              setUpdateComplete(true);
            }}
          />
          <span data-testid="update-complete">{`complete: ${updateComplete}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    // Wait for initial data
    await screen.findByText(USERNAME, {}, { timeout: 10000 });

    // Update cache
    fireEvent.click(screen.getByTestId('update'));

    // Cache should update immediately (no HTTP request)
    await screen.findByText(UPDATED_VALUE, {}, { timeout: 5000 });
    await screen.findByText('complete: true', {}, { timeout: 5000 });

    // Verify the database was NOT updated (cache-only)
    const { data: dbData } = await client
      .from('contact')
      .select('username')
      .eq('id', inserted!.id)
      .single();
    expect(dbData?.username).toBe(USERNAME); // Still original value

    // Cleanup
    await client.from('contact').delete().eq('id', inserted!.id);
  });

  it('should update item across multiple cached queries', async () => {
    const USERNAME = `${testRunPrefix}-multi-query`;
    const UPDATED_VALUE = 'multi-query-updated';

    // Insert a contact
    const { data: inserted } = await client
      .from('contact')
      .insert({ username: USERNAME })
      .select('id,username')
      .single();

    function Page() {
      const [updateComplete, setUpdateComplete] = useState(false);

      // Two different queries that should both contain the same contact
      const { data: query1Data } = useQuery({
        query: client
          .from('contact')
          .select('id,username')
          .eq('id', inserted!.id),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const { data: query2Data } = useQuery({
        query: client
          .from('contact')
          .select('id,username')
          .ilike('username', `${testRunPrefix}%`),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const updateItem = useUpdateItem({
        primaryKeys: ['id'],
        table: 'contact',
        schema: 'public',
      });

      return (
        <div>
          <span data-testid="query1">
            {query1Data?.[0]?.username ?? 'loading1'}
          </span>
          <span data-testid="query2">
            {query2Data?.find((c) => c.id === inserted!.id)?.username ??
              'loading2'}
          </span>
          <button
            data-testid="update"
            onClick={async () => {
              await updateItem({ id: inserted!.id, username: UPDATED_VALUE });
              setUpdateComplete(true);
            }}
          />
          <span data-testid="complete">{`complete: ${updateComplete}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    // Wait for both queries to load
    await waitFor(
      () => {
        expect(screen.getByTestId('query1').textContent).toBe(USERNAME);
        expect(screen.getByTestId('query2').textContent).toBe(USERNAME);
      },
      { timeout: 10000 },
    );

    // Update cache
    fireEvent.click(screen.getByTestId('update'));

    // Both queries should update
    await waitFor(
      () => {
        expect(screen.getByTestId('query1').textContent).toBe(UPDATED_VALUE);
        expect(screen.getByTestId('query2').textContent).toBe(UPDATED_VALUE);
      },
      { timeout: 5000 },
    );

    // Cleanup
    await client.from('contact').delete().eq('id', inserted!.id);
  });

  it('should do nothing if item not found in cache (silent no-op)', async () => {
    const USERNAME = `${testRunPrefix}-silent-noop`;

    // Insert a contact
    const { data: inserted } = await client
      .from('contact')
      .insert({ username: USERNAME })
      .select('id,username')
      .single();

    function Page() {
      const [updateComplete, setUpdateComplete] = useState(false);

      const { data } = useQuery({
        query: client
          .from('contact')
          .select('id,username')
          .eq('id', inserted!.id),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const updateItem = useUpdateItem({
        primaryKeys: ['id'],
        table: 'contact',
        schema: 'public',
      });

      return (
        <div>
          <span data-testid="username">{data?.[0]?.username ?? 'loading'}</span>
          <button
            data-testid="update-nonexistent"
            onClick={async () => {
              // Try to update a non-existent ID
              await updateItem({
                id: '00000000-0000-0000-0000-000000000000',
                username: 'should-not-appear',
              });
              setUpdateComplete(true);
            }}
          />
          <span data-testid="complete">{`complete: ${updateComplete}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    // Wait for data
    await screen.findByText(USERNAME, {}, { timeout: 10000 });

    // Try to update non-existent item
    fireEvent.click(screen.getByTestId('update-nonexistent'));

    // Update should complete without error
    await screen.findByText('complete: true', {}, { timeout: 5000 });

    // Original data should be unchanged
    expect(screen.getByTestId('username').textContent).toBe(USERNAME);

    // Cleanup
    await client.from('contact').delete().eq('id', inserted!.id);
  });

  it('should use custom merge function', async () => {
    const USERNAME = `${testRunPrefix}-custom-merge`;

    // Insert a contact with ticket_number
    const { data: inserted } = await client
      .from('contact')
      .insert({ username: USERNAME, ticket_number: 100 })
      .select('id,username,ticket_number')
      .single();

    function Page() {
      const [updateComplete, setUpdateComplete] = useState(false);

      const { data } = useQuery({
        query: client
          .from('contact')
          .select('id,username,ticket_number')
          .eq('id', inserted!.id),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const updateItem = useUpdateItem({
        primaryKeys: ['id'],
        table: 'contact',
        schema: 'public',
        merge: (existing, input) => ({
          ...existing,
          ...input,
          // Custom merge: increment ticket_number
          ticket_number:
            (existing.ticket_number ?? 0) + (input.ticket_number ?? 0),
        }),
      });

      return (
        <div>
          <span data-testid="ticket">
            {data?.[0]?.ticket_number ?? 'loading'}
          </span>
          <button
            data-testid="update"
            onClick={async () => {
              await updateItem({ id: inserted!.id, ticket_number: 50 });
              setUpdateComplete(true);
            }}
          />
          <span data-testid="complete">{`complete: ${updateComplete}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    // Wait for initial data
    await screen.findByText('100', {}, { timeout: 10000 });

    // Update with custom merge (should add 50 to existing 100)
    fireEvent.click(screen.getByTestId('update'));

    // Should show 150 (100 + 50)
    await screen.findByText('150', {}, { timeout: 5000 });

    // Cleanup
    await client.from('contact').delete().eq('id', inserted!.id);
  });

  it('should handle partial updates (only update provided fields)', async () => {
    const USERNAME = `${testRunPrefix}-partial`;

    // Insert a contact
    const { data: inserted } = await client
      .from('contact')
      .insert({ username: USERNAME, ticket_number: 42 })
      .select('id,username,ticket_number')
      .single();

    function Page() {
      const [updateComplete, setUpdateComplete] = useState(false);

      const { data } = useQuery({
        query: client
          .from('contact')
          .select('id,username,ticket_number')
          .eq('id', inserted!.id),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const updateItem = useUpdateItem({
        primaryKeys: ['id'],
        table: 'contact',
        schema: 'public',
      });

      return (
        <div>
          <span data-testid="username">{data?.[0]?.username ?? 'loading'}</span>
          <span data-testid="ticket">
            {data?.[0]?.ticket_number ?? 'loading'}
          </span>
          <button
            data-testid="update"
            onClick={async () => {
              // Only update username, not ticket_number
              await updateItem({
                id: inserted!.id,
                username: 'partial-updated',
              });
              setUpdateComplete(true);
            }}
          />
          <span data-testid="complete">{`complete: ${updateComplete}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    // Wait for initial data
    await screen.findByText(USERNAME, {}, { timeout: 10000 });
    expect(screen.getByTestId('ticket').textContent).toBe('42');

    // Update only username
    fireEvent.click(screen.getByTestId('update'));

    // Username should update, ticket_number should remain
    await screen.findByText('partial-updated', {}, { timeout: 5000 });
    expect(screen.getByTestId('ticket').textContent).toBe('42');

    // Cleanup
    await client.from('contact').delete().eq('id', inserted!.id);
  });
});
