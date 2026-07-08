import { useDeleteMutation, useQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const TEST_PREFIX = 'postgrest-react-query-delete';

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

  afterEach(cleanup);

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
    function Page() {
      const { data: addressBookAndContact } = useQuery({
        query: client
          .from('address_book')
          .select('id, name, contacts:contact (id, username)')
          .eq('id', addressBookId)
          .single(),
      });

      const { mutateAsync: deleteContactFromAddressBook } = useDeleteMutation({
        query: client.from('address_book_contact'),
        primaryKeys: ['contact', 'address_book'],
        returning: 'contact, address_book',
        revalidateRelations: [
          {
            relation: 'address_book',
            relationIdColumn: 'id',
            fKeyColumn: 'address_book',
          },
        ],
      });

      return (
        <div>
          {addressBookAndContact?.name}
          <span data-testid="count">
            count: {addressBookAndContact?.contacts.length}
          </span>
          {addressBookAndContact?.contacts.map((contact) => {
            return (
              <div key={contact.id} data-testid="contact">
                {contact.username}
                <button
                  onClick={() =>
                    deleteContactFromAddressBook({
                      contact: contact.id,
                      address_book: addressBookAndContact.id,
                    })
                  }
                >
                  Delete Contact
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);

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
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery({
        query: client
          .from('contact')
          .select('id,username', { count: 'exact' })
          .ilike('username', `${testRunPrefix}%`),
      });
      const { mutateAsync: deleteContact } = useDeleteMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        onSuccess: () => setSuccess(true),
      });
      const { mutateAsync: deleteWithEmptyOptions } = useDeleteMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
      });
      const { mutateAsync: deleteWithoutOptions } = useDeleteMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
      });
      return (
        <div>
          <div
            data-testid="delete"
            onClick={async () =>
              await deleteContact({
                id: (data ?? []).find((c) => c)?.id,
              })
            }
          />
          <div
            data-testid="deleteWithEmptyOptions"
            onClick={async () =>
              await deleteWithEmptyOptions({
                id: (data ?? []).find((c) => c)?.id,
              })
            }
          />
          <div
            data-testid="deleteWithoutOptions"
            onClick={async () =>
              await deleteWithoutOptions({
                id: (data ?? []).find((c) => c)?.id,
              })
            }
          />
          {(data ?? []).map((d) => (
            <span key={d.id}>{d.username}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
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

  it(
    'should revalidate other tables when revalidateTables is set',
    { timeout: 30000 },
    async () => {
      // Test that revalidateTables triggers revalidation of contact_note queries
      // when deleting from contact table.
      // Note: contact_note has ON DELETE CASCADE, so notes will be deleted with contact

      const USERNAME = `${testRunPrefix}-rev-tables`;
      const NOTE_1 = `${testRunPrefix}-note-1`;

      // Create a contact
      const { data: contact } = await client
        .from('contact')
        .insert([{ username: USERNAME }])
        .select('id')
        .single()
        .throwOnError();

      // Create a note linked to the contact
      await client
        .from('contact_note')
        .insert([{ contact_id: contact!.id, text: NOTE_1 }])
        .throwOnError();

      const queryClient = new QueryClient();
      function Page() {
        const [success, setSuccess] = useState<boolean>(false);
        // Query notes - this should be revalidated when we delete the contact
        const { data: notes } = useQuery({
          query: client
            .from('contact_note')
            .select('id,text')
            .ilike('text', `${testRunPrefix}%`),
        });
        const { mutateAsync: deleteContact } = useDeleteMutation({
          query: client.from('contact'),
          primaryKeys: ['id'],
          returning: null,
          revalidateTables: [{ schema: 'public', table: 'contact_note' }],
          onSuccess: () => setSuccess(true),
          onError: (error) => console.error(error),
        });
        return (
          <div>
            <div
              data-testid="delete"
              onClick={async () =>
                await deleteContact({
                  id: contact!.id,
                })
              }
            />
            <span data-testid="noteCount">{`noteCount: ${(notes ?? []).length}`}</span>
            <span data-testid="success">{`success: ${success}`}</span>
          </div>
        );
      }

      renderWithConfig(<Page />, queryClient);
      // Initial state: should show 1 note
      await screen.findByText('noteCount: 1', {}, { timeout: 10000 });

      // Delete the contact - this should:
      // 1. Delete the contact
      // 2. CASCADE delete the notes
      // 3. Trigger revalidation of contact_note table (via revalidateTables)
      // 4. Cache should update to show 0 notes
      fireEvent.click(screen.getByTestId('delete'));

      await screen.findByText('success: true', {}, { timeout: 10000 });
      // After revalidation, notes should be 0 (cascade deleted)
      await screen.findByText('noteCount: 0', {}, { timeout: 10000 });
    },
  );
});
