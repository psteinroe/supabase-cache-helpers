import { useOffsetInfiniteQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const TEST_PREFIX = 'postgrest-rq-infinite';

describe('useOffsetInfiniteQuery', { timeout: 20000 }, () => {
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

  it('should fetch pages of data', async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useOffsetInfiniteQuery({
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
          <div data-testid="fetchNext" onClick={() => fetchNextPage()} />
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="list">
            {(data?.pages ?? []).flat().map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="hasNext">{hasNextPage ? 'true' : 'false'}</div>
          <div data-testid="isFetching">
            {isFetchingNextPage ? 'true' : 'false'}
          </div>
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
    const list = screen.getByTestId('list');
    expect(list.childElementCount).toEqual(1);

    fireEvent.click(screen.getByTestId('fetchNext'));

    await screen.findByText(
      `${testRunPrefix}-username-2`,
      {},
      { timeout: 10000 },
    );

    expect(list.childElementCount).toEqual(2);
  });

  it('should return hasNextPage false when no more pages', async () => {
    function Page() {
      const { data, fetchNextPage, hasNextPage } = useOffsetInfiniteQuery({
        query: () =>
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
        pageSize: 10, // Larger than total items
      });
      return (
        <div>
          <div data-testid="fetchNext" onClick={() => fetchNextPage()} />
          <div data-testid="list">
            {(data?.pages ?? []).flat().map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="hasNext">{hasNextPage ? 'true' : 'false'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );

    expect(screen.getByTestId('hasNext').textContent).toEqual('false');
  });

  it('should not fetch when query is null', async () => {
    function Page() {
      const { data, isLoading } = useOffsetInfiniteQuery({
        query: null,
        pageSize: 1,
      });
      return (
        <div>
          <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
          <div data-testid="hasData">{data ? 'true' : 'false'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    // Should not be loading and have no data
    expect(screen.getByTestId('loading').textContent).toEqual('false');
    expect(screen.getByTestId('hasData').textContent).toEqual('false');
  });
});
