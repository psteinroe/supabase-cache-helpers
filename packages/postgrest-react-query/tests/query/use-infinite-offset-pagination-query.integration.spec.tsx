import { useInfiniteOffsetPaginationQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const TEST_PREFIX = 'postgrest-rq-paginate';

describe('useInfiniteOffsetPaginationQuery', { timeout: 20000 }, () => {
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

  it('should provide page navigation', async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { currentPage, pageIndex, nextPage, previousPage, setPage } =
        useInfiniteOffsetPaginationQuery({
          query: condition
            ? () =>
                client
                  .from('contact')
                  .select('id,username')
                  .ilike('username', `${testRunPrefix}%`)
                  .order('username', { ascending: true })
            : null,
          pageSize: 1,
        });
      return (
        <div>
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="next" onClick={() => nextPage?.()} />
          <div data-testid="prev" onClick={() => previousPage?.()} />
          <div data-testid="setPage2" onClick={() => setPage(2)} />
          <div data-testid="currentPage">
            {(currentPage ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="pageIndex">{pageIndex}</div>
          <div data-testid="hasNext">{nextPage ? 'true' : 'false'}</div>
          <div data-testid="hasPrev">{previousPage ? 'true' : 'false'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    fireEvent.click(screen.getByTestId('setCondition'));
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );

    expect(screen.getByTestId('pageIndex').textContent).toEqual('0');
    expect(screen.getByTestId('hasNext').textContent).toEqual('true');
    expect(screen.getByTestId('hasPrev').textContent).toEqual('false');

    // Go to next page
    fireEvent.click(screen.getByTestId('next'));
    await screen.findByText(
      `${testRunPrefix}-username-2`,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('pageIndex').textContent).toEqual('1');
    expect(screen.getByTestId('hasPrev').textContent).toEqual('true');

    // Go back
    fireEvent.click(screen.getByTestId('prev'));
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('pageIndex').textContent).toEqual('0');
  });

  it('should allow jumping to a specific page', async () => {
    function Page() {
      const { currentPage, pageIndex, setPage } =
        useInfiniteOffsetPaginationQuery({
          query: () =>
            client
              .from('contact')
              .select('id,username')
              .ilike('username', `${testRunPrefix}%`)
              .order('username', { ascending: true }),
          pageSize: 1,
        });
      return (
        <div>
          <div data-testid="setPage2" onClick={() => setPage(2)} />
          <div data-testid="currentPage">
            {(currentPage ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="pageIndex">{pageIndex}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );

    fireEvent.click(screen.getByTestId('setPage2'));
    await screen.findByText(
      `${testRunPrefix}-username-3`,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('pageIndex').textContent).toEqual('2');
  });
});
