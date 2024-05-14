import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { act, screen } from '@testing-library/react';
import React, { useState } from 'react';

import { useSubscriptionQuery, useQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-react-query-subscription-query';

describe('useSubscriptionQuery', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
  });

  afterEach(async () => {
    if (client) await client.removeAllChannels();
  });

  it('should properly update cache', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-1`;
    function Page() {
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('id,username,has_low_ticket_number,ticket_number', {
            count: 'exact',
          })
          .eq('username', USERNAME_1),
      );

      const [cbCalled, setCbCalled] = useState<boolean>(false);

      const { status } = useSubscriptionQuery(
        client,
        `public:contact:username=eq.${USERNAME_1}`,
        {
          event: '*',
          table: 'contact',
          schema: 'public',
          filter: `username=eq.${USERNAME_1}`,
        },
        ['id'],
        'id,username,has_low_ticket_number,ticket_number',
        {
          callback: (evt) => {
            if (evt.data.ticket_number === 1000) {
              setCbCalled(true);
            }
          },
        },
      );

      return (
        <div>
          {(data ?? []).map((d) => (
            <span
              key={d.id}
            >{`ticket_number: ${d.ticket_number} | has_low_ticket_number: ${d.has_low_ticket_number}`}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="status">{status}</span>
          <span data-testid="callback-called">{`cbCalled: ${cbCalled}`}</span>
        </div>
      );
    }

    const { unmount } = renderWithConfig(<Page />, queryClient);
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    await screen.findByText('SUBSCRIBED', {}, { timeout: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await act(async () => {
      await client
        .from('contact')
        .insert({ username: USERNAME_1, ticket_number: 1 })
        .select('*')
        .throwOnError()
        .single();
    });
    await screen.findByText(
      'ticket_number: 1 | has_low_ticket_number: true',
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await act(async () => {
      await client
        .from('contact')
        .update({ ticket_number: 1000 })
        .eq('username', USERNAME_1)
        .throwOnError();
    });
    await screen.findByText(
      'ticket_number: 1000 | has_low_ticket_number: false',
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await screen.findByText('cbCalled: true', {}, { timeout: 10000 });
    await act(async () => {
      await client
        .from('contact')
        .delete()
        .eq('username', USERNAME_1)
        .throwOnError();
    });
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 0');
    unmount();
  });
});
