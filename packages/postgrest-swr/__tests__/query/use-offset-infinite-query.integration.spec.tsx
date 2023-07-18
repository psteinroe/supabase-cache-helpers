import { fireEvent, screen } from '@testing-library/react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useOffsetInfiniteQuery } from '../../src';
import { renderWithConfig } from '../utils';
import type { Database } from '../database.types';
import { useState } from 'react';

const TEST_PREFIX = 'postgrest-swr-infinite';

describe('useOffsetInfiniteQuery', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
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
    provider = new Map();
  });

  it('should behave like the SWR infinite hook', async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { data, size, setSize, isValidating, error } =
        useOffsetInfiniteQuery(
          condition
            ? client
                .from('contact')
                .select('id,username')
                .ilike('username', `${testRunPrefix}%`)
                .order('username', { ascending: true })
            : null,
          { pageSize: 1 }
        );
      return (
        <div>
          <div data-testid="setSizeTo3" onClick={() => setSize(3)} />
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="list">
            {(data ?? []).flat().map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="size">{size}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    fireEvent.click(screen.getByTestId('setCondition'));
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 }
    );
    const list = screen.getByTestId('list');
    expect(list.childElementCount).toEqual(1);
    expect(screen.getByTestId('size').textContent).toEqual('1');

    fireEvent.click(screen.getByTestId('setSizeTo3'));

    await screen.findByText(
      `${testRunPrefix}-username-2`,
      {},
      { timeout: 10000 }
    );
    await screen.findByText(
      `${testRunPrefix}-username-3`,
      {},
      { timeout: 10000 }
    );

    expect(list.childElementCount).toEqual(3);
    expect(screen.getByTestId('size').textContent).toEqual('3');
  });
});
