import { usePaginatedQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const TEST_PREFIX = 'postgrest-rq-paginated';

describe('usePaginatedQuery', { timeout: 20000 }, () => {
  let client: SupabaseClient<Database>;
  let queryClient: QueryClient;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 1000)}`;
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

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(cleanup);

  it('should fetch page data and count in parallel', async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { data, count, page, totalPages, nextPage, previousPage, setPage } =
        usePaginatedQuery({
          query: condition
            ? () =>
                client
                  .from('contact')
                  .select('id,username')
                  .ilike('username', `${testRunPrefix}%`)
                  .order('username', { ascending: true })
            : null,
          pageSize: 2,
        });
      return (
        <div>
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="next" onClick={() => nextPage?.()} />
          <div data-testid="prev" onClick={() => previousPage?.()} />
          <div data-testid="setPage1" onClick={() => setPage(1)} />
          <div data-testid="list">
            {(data ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="page">{page}</div>
          <div data-testid="count">{count ?? 'null'}</div>
          <div data-testid="totalPages">{totalPages ?? 'null'}</div>
          <div data-testid="hasNext">{nextPage ? 'true' : 'false'}</div>
          <div data-testid="hasPrev">{previousPage ? 'true' : 'false'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    fireEvent.click(screen.getByTestId('setCondition'));

    // Wait for both data and count
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );

    // Check initial state
    expect(screen.getByTestId('page').textContent).toEqual('0');
    expect(screen.getByTestId('count').textContent).toEqual('4');
    expect(screen.getByTestId('totalPages').textContent).toEqual('2');
    expect(screen.getByTestId('hasNext').textContent).toEqual('true');
    expect(screen.getByTestId('hasPrev').textContent).toEqual('false');

    const list = screen.getByTestId('list');
    expect(list.childElementCount).toEqual(2);

    // Go to next page
    fireEvent.click(screen.getByTestId('next'));
    await screen.findByText(
      `${testRunPrefix}-username-3`,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('page').textContent).toEqual('1');
    expect(screen.getByTestId('hasNext').textContent).toEqual('false');
    expect(screen.getByTestId('hasPrev').textContent).toEqual('true');

    // Go back to first page
    fireEvent.click(screen.getByTestId('prev'));
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('page').textContent).toEqual('0');
  });

  it('should clamp page to valid range', async () => {
    function Page() {
      const { data, page, totalPages, setPage } = usePaginatedQuery({
        query: () =>
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
        pageSize: 2,
      });
      return (
        <div>
          <div data-testid="setPageNegative" onClick={() => setPage(-5)} />
          <div data-testid="setPageTooHigh" onClick={() => setPage(100)} />
          <div data-testid="list">
            {(data ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="page">{page}</div>
          <div data-testid="totalPages">{totalPages ?? 'null'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );

    // Try setting negative page
    fireEvent.click(screen.getByTestId('setPageNegative'));
    expect(screen.getByTestId('page').textContent).toEqual('0');

    // Try setting page too high
    fireEvent.click(screen.getByTestId('setPageTooHigh'));
    // Should clamp to last page (1, since totalPages is 2)
    await screen.findByText(
      `${testRunPrefix}-username-3`,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('page').textContent).toEqual('1');
  });

  it('should not fetch when query is null', async () => {
    function Page() {
      const { data, count, isLoading } = usePaginatedQuery({
        query: null,
        pageSize: 2,
      });
      return (
        <div>
          <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
          <div data-testid="hasData">{data ? 'true' : 'false'}</div>
          <div data-testid="count">{count ?? 'null'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    expect(screen.getByTestId('loading').textContent).toEqual('false');
    expect(screen.getByTestId('hasData').textContent).toEqual('false');
    expect(screen.getByTestId('count').textContent).toEqual('null');
  });

  it('should correctly count with inner joins', async () => {
    // Create contacts with and without country (inner join test)
    const innerJoinPrefix = `${testRunPrefix}-innerjoin`;

    // First, create a contact WITH a country
    await client
      .from('contact')
      .insert([
        { username: `${innerJoinPrefix}-with-country`, country: 'DE' },
        { username: `${innerJoinPrefix}-no-country-1`, country: null },
        { username: `${innerJoinPrefix}-no-country-2`, country: null },
      ])
      .throwOnError();

    function Page() {
      const { data, count, totalPages } = usePaginatedQuery({
        // Inner join will filter out contacts without country
        query: () =>
          client
            .from('contact')
            .select('id,username,country!inner(name)')
            .ilike('username', `${innerJoinPrefix}%`)
            .order('username', { ascending: true }),
        pageSize: 10,
      });
      return (
        <div>
          <div data-testid="list">
            {(data ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          {/* count should be 1 (only the contact with country) */}
          <div data-testid="count">{count ?? 'null'}</div>
          <div data-testid="totalPages">{totalPages ?? 'null'}</div>
          <div data-testid="dataLength">{data?.length ?? 0}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    await screen.findByText(
      `${innerJoinPrefix}-with-country`,
      {},
      { timeout: 10000 },
    );

    // Inner join should filter: count should be 1, not 3
    expect(screen.getByTestId('count').textContent).toEqual('1');
    expect(screen.getByTestId('totalPages').textContent).toEqual('1');
    expect(screen.getByTestId('dataLength').textContent).toEqual('1');

    // Cleanup
    await client
      .from('contact')
      .delete()
      .ilike('username', `${innerJoinPrefix}%`)
      .throwOnError();
  });
});
