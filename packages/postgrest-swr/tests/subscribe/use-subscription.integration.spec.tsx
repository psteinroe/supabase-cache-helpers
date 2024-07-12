import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { act, cleanup, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { useQuery, useSubscription } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-swr-subscription-plain';

describe('useSubscription', { timeout: 20000 }, () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 1000)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
  });

  beforeEach(() => {
    provider = new Map();
  });

  afterEach(async () => {
    if (client) await client.removeAllChannels();
    cleanup();
  });

  it('should properly update cache', async () => {
    const USERNAME_1 = `${testRunPrefix}-1`;
    function Page() {
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('id,username,ticket_number', { count: 'exact' })
          .eq('username', USERNAME_1),
      );

      const [cbCalled, setCbCalled] = useState<boolean>(false);

      const { status } = useSubscription(
        client,
        `public:contact:username=eq.${USERNAME_1}`,
        {
          event: '*',
          table: 'contact',
          schema: 'public',
          filter: `username=eq.${USERNAME_1}`,
        },
        ['id'],
        { callback: () => setCbCalled(true), revalidate: true },
      );

      const ticketNumber = Array.isArray(data) ? data[0]?.ticket_number : null;

      return (
        <div>
          <span key={ticketNumber}>{`ticket_number: ${ticketNumber}`}</span>
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="status">{status}</span>
          <span data-testid="callback-called">{`cbCalled: ${cbCalled}`}</span>
        </div>
      );
    }

    const { unmount } = renderWithConfig(<Page />, {
      provider: () => provider,
    });
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    await screen.findByText('SUBSCRIBED', {}, { timeout: 10000 });
    await act(async () => {
      await client
        .from('contact')
        .insert({ username: USERNAME_1, ticket_number: 1 })
        .select('id')
        .throwOnError()
        .single();
    });
    await screen.findByText('ticket_number: 1', {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await act(async () => {
      await client
        .from('contact')
        .update({ ticket_number: 5 })
        .eq('username', USERNAME_1)
        .throwOnError();
    });
    await screen.findByText('ticket_number: 5', {}, { timeout: 20000 });
    await screen.findByText('cbCalled: true', {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
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
