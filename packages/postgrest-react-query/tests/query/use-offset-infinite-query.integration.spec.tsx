import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { useOffsetInfiniteQuery } from '../../src/query/use-offset-infinite-query';
import { fetchOffsetPaginationFallbackData } from '../../src/query/fetch';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-react-query-infinite';

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

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  it('should behave like the React Query infinite hook', async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { data, size, setSize, isLoading, error } =
        useOffsetInfiniteQuery(
          condition
            ? client
                .from('contact')
                .select('id,username')
                .ilike('username', `${testRunPrefix}%`)
                .order('username', { ascending: true })
            : null,
          { pageSize: 2 },
        );
      return (
        <div>
          <div data-testid="setSizeTo3" onClick={() => setSize(3)} />
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="list">
            {(data ?? []).flat().map((p: any) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="size">{size}</div>
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
    expect(list.childElementCount).toEqual(2);
    expect(screen.getByTestId('size').textContent).toEqual('1');

    fireEvent.click(screen.getByTestId('setSizeTo3'));

    await waitFor(() => {
      expect(screen.getByTestId('size').textContent).toEqual('2');
    }, { timeout: 10000 });

    await waitFor(() => {
      expect(list.childElementCount).toEqual(4);
    }, { timeout: 10000 });
  });

  it('should work with fallbackData', async () => {
    const query = client
      .from('contact')
      .select('id,username')
      .ilike('username', `${testRunPrefix}%`)
      .order('username', { ascending: true });
    const [_, fallbackData] = await fetchOffsetPaginationFallbackData(query, 1);
    function Page() {
      const { data, size } = useOffsetInfiniteQuery(null, {
        pageSize: 1,
        fallbackData,
      });
      return (
        <div>
          <div data-testid="list">
            {(data ?? []).flat().map((p: any) => (
              <div key={p.id}>{`username: ${p.username}`}</div>
            ))}
          </div>
          <div data-testid="size">{size}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    await waitFor(() => {
      expect(screen.getByTestId('size').textContent).toEqual('1');
    }, { timeout: 10000 });
  });
}); 