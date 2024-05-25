import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/vue-query';
import { fireEvent, screen } from '@testing-library/vue';

import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import Page from '../components/InsertMutationPage.vue';

const TEST_PREFIX = 'postgrest-vue-query-insert';

describe('useInsertMutation', () => {
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

  it('should insert into existing cache item with alias', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-1`;
    const USERNAME_2 = `${testRunPrefix}-2`;
    const USERNAME_3 = `${testRunPrefix}-3`;

    renderWithConfig(
      Page,
      {
        client,
        userName1: USERNAME_1,
        userName2: USERNAME_2,
        userName3: USERNAME_3,
      },
      queryClient,
    );
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('insertMany'));
    await screen.findByText(USERNAME_2, {}, { timeout: 10000 });
    await screen.findByText(USERNAME_3, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 2');
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });
});
