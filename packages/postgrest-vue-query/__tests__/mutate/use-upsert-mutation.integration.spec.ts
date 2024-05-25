import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/vue-query';
import { fireEvent, screen } from '@testing-library/vue';

import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import Page from '../components/UpsertMutationPage.vue';

const TEST_PREFIX = 'postgrest-react-query-upsert';

describe('useUpsertMutation', () => {
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

  it('should upsert into existing cache item', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-2`;
    const USERNAME_2 = `${testRunPrefix}-3`;

    await client
      .from('contact')
      .insert({
        username: USERNAME_1,
        golden_ticket: true,
      })
      .throwOnError();
    renderWithConfig(
      Page,
      { client, username1: USERNAME_1, username2: USERNAME_2 },
      queryClient,
    );
    await screen.findByText('count: 1', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('upsertMany'));
    await screen.findByText(`${USERNAME_1} - true`, {}, { timeout: 10000 });
    await screen.findByText(`${USERNAME_2} - null`, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 2');
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });
});
