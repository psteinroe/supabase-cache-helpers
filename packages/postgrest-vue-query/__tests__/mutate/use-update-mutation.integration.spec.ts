import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/vue-query';
import { fireEvent, screen } from '@testing-library/vue';

import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import Page from '../components/UpdateMutationPage.vue';

const TEST_PREFIX = 'postgrest-react-query-update';

describe('useUpdateMutation', () => {
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

  it('should update existing cache item', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-2`;
    const USERNAME_2 = `${testRunPrefix}-3`;

    renderWithConfig(
      Page,
      { client, username1: USERNAME_1, username2: USERNAME_2 },
      queryClient,
    );
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText(USERNAME_1, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText(USERNAME_2, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });
});
