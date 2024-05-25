import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/vue-query';
import { screen } from '@testing-library/vue';

import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import Page from '../components/SubscriptionPage.vue';

const TEST_PREFIX = 'postgrest-vue-query-subscription-plain';

describe('useSubscription', () => {
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

    const { unmount } = renderWithConfig(
      Page,
      { client, username: USERNAME_1 },
      queryClient,
    );
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    await screen.findByText('SUBSCRIBED', {}, { timeout: 10000 });

    await client
      .from('contact')
      .insert({ username: USERNAME_1, ticket_number: 1 })
      .select('id')
      .throwOnError()
      .single();

    await screen.findByText('ticket_number: 1', {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');

    await client
      .from('contact')
      .update({ ticket_number: 5 })
      .eq('username', USERNAME_1)
      .throwOnError();

    await screen.findByText('ticket_number: 5', {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await screen.findByText('cbCalled: true', {}, { timeout: 10000 });
    unmount();
  });
});
