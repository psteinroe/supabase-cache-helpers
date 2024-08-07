import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { fireEvent, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, it } from 'vitest';

import { useMutateItem, useQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-swr-mutate-item';

describe('useMutateItem', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;

  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
  });

  beforeEach(async () => {
    provider = new Map();

    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert(
        new Array<number>(3)
          .fill(0)
          .map((_, idx) => ({ username: `${testRunPrefix}-${idx}` })),
      )
      .select('*');
    contacts = data as Database['public']['Tables']['contact']['Row'][];
  });

  it('should mutate existing item in cache', async () => {
    function Page() {
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('id,username', { count: 'exact' })
          .ilike('username', `${testRunPrefix}%`),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );

      const mutate = useMutateItem({
        schema: 'public',
        table: 'contact',
        primaryKeys: ['id'],
      });

      return (
        <div>
          <div
            data-testid="mutate"
            onClick={async () =>
              await mutate(
                {
                  id: (data ?? []).find((c) => c)?.id,
                },
                (c) => ({ ...c, username: `${c.username}-updated` }),
              )
            }
          />
          {(data ?? []).map((d) => (
            <span key={d.id}>{d.username}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText(
      `count: ${contacts.length}`,
      {},
      { timeout: 10000 },
    );
    fireEvent.click(screen.getByTestId('mutate'));
    await screen.findByText(
      `${testRunPrefix}-0-updated`,
      {},
      { timeout: 10000 },
    );
  });
});
