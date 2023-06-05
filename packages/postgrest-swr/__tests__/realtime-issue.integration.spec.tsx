import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { act, screen } from '@testing-library/react';
import { useEffect, useRef, useState } from 'react';

import { useSubscription, useQuery, useInsertMutation } from '../src';
import type { Database } from './database.types';
import { renderWithConfig } from './utils';

const TEST_PREFIX = 'postgrest-swr-realtime-issue';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Realtime Issue (https://github.com/GaryAustin1/Realtime2)', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;
  let contacts: { id: string }[];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
  });

  beforeEach(async () => {
    provider = new Map();

    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
    const { data } = await client
      .from('contact')
      .insert(
        [...Array(20).keys()].map((k) => ({
          username: `${testRunPrefix}-before${k}`,
        }))
      )
      .select('id')

      .throwOnError();
    contacts = data as { id: string }[];
  });

  afterEach(async () => {
    if (client) await client.removeAllChannels();
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
  });

  it('first query, then connect', async () => {
    function Subscriber({ onMount }: { onMount: () => void }) {
      const { status } = useSubscription(
        client.channel(`public:contact`),
        {
          event: '*',
          table: 'contact',
          schema: 'public',
        },
        ['id']
      );

      useEffect(() => {
        onMount();
      }, []);

      return <span data-testid="status">{status}</span>;
    }
    function Page() {
      const [doneMutating, setDoneMutating] = useState<boolean>(false);
      const { data, count, isLoading } = useQuery(
        client
          .from('contact')
          .select('id,username', { count: 'exact' })
          .ilike('username', `${testRunPrefix}%`)
          .order('username')
          .limit(100),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );

      const { trigger: insert } = useInsertMutation(
        client.from('contact'),
        ['id'],
        'id,username',
        { disableAutoQuery: true }
      );

      const mutate = async (n: number, startAt: number) => {
        for (const idx of [...Array(n).keys()]) {
          const i = idx + startAt;
          await Promise.all([
            insert([{ username: `${testRunPrefix}-insert${i}` }]),
            client
              .from('contact')
              .update({
                id: contacts[i].id,
                username: `${testRunPrefix}-after${i}`,
              })
              .eq('id', contacts[i].id),
            await sleep(50),
          ]);
        }
      };

      useEffect(() => {
        mutate(10, 0);
      }, []);

      return (
        <div>
          {(data ?? []).map((d) => (
            <span key={d.id}>{`username: ${d.username}`}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          {isLoading ? null : (
            <Subscriber
              onMount={() =>
                mutate(10, 10).then(() => {
                  setDoneMutating(true);
                })
              }
            />
          )}
          <span data-testid="doneMutating">
            {`doneMutating: ${doneMutating}`}
          </span>
        </div>
      );
    }

    const { unmount } = renderWithConfig(<Page />, {
      provider: () => provider,
    });
    await screen.findByText(`doneMutating: true`, {}, { timeout: 100000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 40');
    await Promise.all(
      [...Array(20).keys()].map(
        async (k) =>
          await screen.findByText(
            `username: ${testRunPrefix}-insert${k}`,
            {},
            { timeout: 20000 }
          )
      )
    );
    await Promise.all(
      [...Array(20).keys()].map(
        async (k) =>
          await screen.findByText(
            `username: ${testRunPrefix}-after${k}`,
            {},
            { timeout: 20000 }
          )
      )
    );

    unmount();
  }, 200000);

  it('first connect, then query', async () => {
    function Page() {
      const { status } = useSubscription(
        client.channel(`public:contact`),
        {
          event: '*',
          table: 'contact',
          schema: 'public',
        },
        ['id']
      );

      const [doneMutating, setDoneMutating] = useState<boolean>(false);

      const { data, count } = useQuery(
        status !== 'SUBSCRIBED'
          ? null
          : client
              .from('contact')
              .select('id,username', { count: 'exact' })
              .ilike('username', `${testRunPrefix}%`)
              .order('username')
              .limit(100),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );

      const { trigger: insert } = useInsertMutation(
        client.from('contact'),
        ['id'],
        'id,username',
        { disableAutoQuery: true }
      );

      useEffect(() => {
        const mutate = async () => {
          for (const i of [...Array(20).keys()]) {
            await Promise.all([
              insert([{ username: `${testRunPrefix}-insert${i}` }]),
              client
                .from('contact')
                .update({
                  id: contacts[i].id,
                  username: `${testRunPrefix}-after${i}`,
                })
                .eq('id', contacts[i].id),
              await sleep(50),
            ]);
          }
        };
        mutate().then(() => {
          setDoneMutating(true);
        });
      }, []);

      return (
        <div>
          {(data ?? []).map((d) => (
            <span key={d.id}>{`username: ${d.username}`}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="status">{status}</span>
          <span data-testid="doneMutating">
            {`doneMutating: ${doneMutating}`}
          </span>
        </div>
      );
    }

    const { unmount } = renderWithConfig(<Page />, {
      provider: () => provider,
    });
    await screen.findByText(`doneMutating: true`, {}, { timeout: 100000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 40');
    await Promise.all(
      [...Array(20).keys()].map(
        async (k) =>
          await screen.findByText(
            `username: ${testRunPrefix}-insert${k}`,
            {},
            { timeout: 20000 }
          )
      )
    );
    await Promise.all(
      [...Array(20).keys()].map(
        async (k) =>
          await screen.findByText(
            `username: ${testRunPrefix}-after${k}`,
            {},
            { timeout: 20000 }
          )
      )
    );

    unmount();
  }, 200000);
});
