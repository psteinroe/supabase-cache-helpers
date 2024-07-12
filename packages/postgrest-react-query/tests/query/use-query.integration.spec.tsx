import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { fetchQueryInitialData, prefetchQuery, useQuery } from '../../src';
import { encode } from '../../src/lib/key';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-react-query-query';

describe('useQuery', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ])
      .select('*')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });

  afterEach(cleanup);

  it('should work for single', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username')
      .eq('username', contacts[0].username ?? '')
      .single();
    function Page() {
      const { data } = useQuery(query);

      return <div>{data?.username}</div>;
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 },
    );
    expect(queryClient.getQueryData(encode(query, false))).toBeDefined();
  });

  it('should work for maybeSingle', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username')
      .eq('username', 'unknown')
      .maybeSingle();
    function Page() {
      const { data, isLoading } = useQuery(query);
      return (
        <div>{isLoading ? 'validating' : `username: ${data?.username}`}</div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('username: undefined', {}, { timeout: 10000 });
    expect(queryClient.getQueryData(encode(query, false))).toBeDefined();
  });

  it('should work with multiple', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username', { count: 'exact' })
      .ilike('username', `${testRunPrefix}%`);
    function Page() {
      const { data, count } = useQuery(query);
      return (
        <div>
          <div>
            {
              (data ?? []).find((d) => d.username === contacts[0].username)
                ?.username
            }
          </div>
          <div data-testid="count">{count}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('count').textContent).toEqual('4');
    expect(queryClient.getQueryData(encode(query, false))).toBeDefined();
  });

  it('should work for with conditional query', async () => {
    const queryClient = new QueryClient();
    function Page() {
      const [condition, setCondition] = useState(false);
      const { data, isLoading } = useQuery(
        client
          .from('contact')
          .select('id,username')
          .eq('username', contacts[0].username ?? '')
          .maybeSingle(),
        { enabled: condition },
      );

      return (
        <div>
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div>{data?.username ?? 'undefined'}</div>
          <div>{`isLoading: ${isLoading}`}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('undefined', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('setCondition'));
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 },
    );
  });

  it('refetch should work', async () => {
    const queryClient = new QueryClient();
    function Page() {
      const { data, refetch, isLoading } = useQuery(
        client
          .from('contact')
          .select('id,username')
          .eq('username', contacts[0].username ?? '')
          .single(),
      );
      const [refetched, setRefetched] = useState<typeof data | null>(null);

      return (
        <div>
          <div
            data-testid="mutate"
            onClick={async () => {
              setRefetched((await refetch())?.data?.data);
            }}
          />
          <div>{data?.username ?? 'undefined'}</div>
          <div>{`refetched: ${!!refetched}`}</div>
          <div>{`isLoading: ${isLoading}`}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('isLoading: false', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('mutate'));
    await screen.findByText('refetched: true', {}, { timeout: 10000 });
  });

  it('prefetch should work', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username')
      .eq('username', contacts[0].username ?? '')
      .single();
    await prefetchQuery(queryClient, query);
    let hasBeenFalse = false;
    function Page() {
      const { data } = useQuery(query);
      if (!data) hasBeenFalse = true;

      return (
        <div>
          <div>{data?.username ?? 'undefined'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    expect(hasBeenFalse).toBe(false);
    await screen.findByText(contacts[0].username!, {}, { timeout: 10000 });
  });

  it('initalData should work', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username')
      .eq('username', contacts[0].username ?? '')
      .single();
    const [key, initial] = await fetchQueryInitialData(query);
    let hasBeenFalse = false;
    function Page() {
      const { data } = useQuery(query, { initialData: initial });
      if (!data) hasBeenFalse = true;

      return (
        <div>
          <div>{data?.username ?? 'undefined'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    expect(hasBeenFalse).toBe(false);
    await screen.findByText(contacts[0].username!, {}, { timeout: 10000 });
  });
});
