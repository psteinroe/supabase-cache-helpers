import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useQuery, useSubscriptionQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-react-query-subscription-query';

describe('useSubscriptionQuery', { timeout: 20000 }, () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 1000)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
  });

  afterEach(async () => {
    if (client) await client.removeAllChannels();
    cleanup();
  });

  it('should properly update cache', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-1`;
    function Page() {
      const { data, count, error } = useQuery(
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

      const ticketNumber = Array.isArray(data) ? data[0]?.ticket_number : null;
      const hasLowTicketNumber = Array.isArray(data)
        ? data[0]?.has_low_ticket_number
        : null;

      return (
        <div>
          <span
            key={ticketNumber}
          >{`ticket_number: ${ticketNumber} | has_low_ticket_number: ${hasLowTicketNumber}`}</span>
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="status">{status}</span>
          <span data-testid="callback-called">{`cbCalled: ${cbCalled}`}</span>
          <div
            data-testid="insert"
            onClick={async () =>
              await client
                .from('contact')
                .insert({ username: USERNAME_1, ticket_number: 1 })
                .select('*')
                .throwOnError()
                .single()
            }
          />
          <div
            data-testid="update"
            onClick={async () =>
              await client
                .from('contact')
                .update({ ticket_number: 1000 })
                .eq('username', USERNAME_1)
                .throwOnError()
            }
          />
          <div
            data-testid="delete"
            onClick={async () =>
              await client
                .from('contact')
                .delete()
                .eq('username', USERNAME_1)
                .throwOnError()
            }
          />
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    await screen.findByText('SUBSCRIBED', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText(
      'ticket_number: 1 | has_low_ticket_number: true',
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');

    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText(
      'ticket_number: 1000 | has_low_ticket_number: false',
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await screen.findByText('cbCalled: true', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('delete'));
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 0');
  });
});
