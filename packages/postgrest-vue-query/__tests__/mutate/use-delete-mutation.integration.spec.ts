import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/vue-query';
import { fireEvent, screen } from '@testing-library/vue';

import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import DeleteMutationPage1 from '../components/DeleteMutationPage-1.vue';
import DeleteMutationPage2 from '../components/DeleteMutationPage-2.vue';

const TEST_PREFIX = 'postgrest-vue-query-delete';

describe('useDeleteMutation', () => {
  let client: SupabaseClient<Database>;
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
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert(
        new Array(3)
          .fill(0)
          .map((idx) => ({ username: `${testRunPrefix}-${idx}` })),
      )
      .select('*');
    contacts = data as Database['public']['Tables']['contact']['Row'][];
  });

  it('should invalidate address_book cache after delete', async () => {
    const { data: addressBooks } = await client
      .from('address_book')
      .insert([
        {
          name: 'hello',
        },
      ])
      .select('id');

    const addressBookId = addressBooks ? addressBooks[0].id : '';

    await client.from('address_book_contact').insert([
      {
        address_book: addressBookId,
        contact: contacts[0].id,
      },
      {
        address_book: addressBookId,
        contact: contacts[1].id,
      },
    ]);

    const queryClient = new QueryClient();

    renderWithConfig(
      DeleteMutationPage1,
      { client, addressBookId },
      queryClient,
    );

    await screen.findByText(`hello`, {}, { timeout: 10000 });

    await screen.findByText(`count: 2`, {}, { timeout: 10000 });

    const deleteButtons = screen.getAllByRole(`button`, {
      name: /Delete Contact/i,
    });

    fireEvent.click(deleteButtons[0]);

    await screen.findByText(`count: 1`, {}, { timeout: 10000 });
  });

  it('should delete existing cache item and reduce count', async () => {
    const queryClient = new QueryClient();

    renderWithConfig(DeleteMutationPage2, {}, queryClient);
    await screen.findByText(
      `count: ${contacts.length}`,
      {},
      { timeout: 10000 },
    );
    fireEvent.click(screen.getByTestId('deleteWithEmptyOptions'));
    await screen.findByText(
      `count: ${contacts.length - 1}`,
      {},
      { timeout: 10000 },
    );
    fireEvent.click(screen.getByTestId('deleteWithoutOptions'));
    await screen.findByText(
      `count: ${contacts.length - 2}`,
      {},
      { timeout: 10000 },
    );
    fireEvent.click(screen.getByTestId('delete'));
    await screen.findByText('success: true', {}, { timeout: 10000 });
    await screen.findByText(
      `count: ${contacts.length - 3}`,
      {},
      { timeout: 10000 },
    );
  });
});
