import { useCursorInfiniteScrollQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const TEST_PREFIX = 'postgrest-rq-cursor';

describe('useCursorInfiniteScrollQuery', { timeout: 20000 }, () => {
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

  it('should fetch with cursor-based pagination', async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { data, loadMore } = useCursorInfiniteScrollQuery({
        query: condition
          ? () =>
              client
                .from('contact')
                .select('id,username')
                .ilike('username', `${testRunPrefix}%`)
                .order('username', { ascending: true })
                .limit(2)
          : null,
        orderBy: 'username',
      });
      return (
        <div>
          <div data-testid="loadMore" onClick={() => loadMore?.()} />
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="list">
            {(data ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="hasLoadMore">{loadMore ? 'true' : 'false'}</div>
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
    expect(screen.getByTestId('hasLoadMore').textContent).toEqual('true');

    fireEvent.click(screen.getByTestId('loadMore'));

    await screen.findByText(
      `${testRunPrefix}-username-3`,
      {},
      { timeout: 10000 },
    );

    expect(list.childElementCount).toEqual(4);
  });

  it('should return null loadMore when no more data', async () => {
    function Page() {
      const { data, loadMore } = useCursorInfiniteScrollQuery({
        query: () =>
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true })
            .limit(10), // Larger than total items
        orderBy: 'username',
      });
      return (
        <div>
          <div data-testid="list">
            {(data ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="hasLoadMore">{loadMore ? 'true' : 'false'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );

    expect(screen.getByTestId('hasLoadMore').textContent).toEqual('false');
  });
});
