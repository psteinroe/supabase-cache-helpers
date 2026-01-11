import { useDeleteMutation, useQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const TEST_PREFIX = 'postgrest-swr-delete';

describe('useDeleteMutation', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;
  let testRunNumber: number;

  let contacts: Database['public']['Tables']['contact']['Row'][];
  let multiPks: Database['public']['Tables']['multi_pk']['Row'][];

  beforeAll(async () => {
    testRunNumber = Math.floor(Math.random() * 100);
    testRunPrefix = `${TEST_PREFIX}-${testRunNumber}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
  });

  beforeEach(async () => {
    provider = new Map();

    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert(
        new Array<number>(3)
          .fill(0)
          .map((_, idx) => ({ username: `${testRunPrefix}-${idx}` })),
      )
      .select('*');
    contacts = data as Database['public']['Tables']['contact']['Row'][];

    await client.from('multi_pk').delete().ilike('name', `${TEST_PREFIX}%`);

    const input = new Array<number>(3).fill(0).map((_, idx) => ({
      id_1: testRunNumber + idx,
      id_2: testRunNumber + idx,
      name: `${testRunPrefix}-${idx}`,
    }));

    const { data: multiPksResult } = await client
      .from('multi_pk')
      .insert(input)
      .select('*')
      .throwOnError();

    multiPks =
      multiPksResult as Database['public']['Tables']['multi_pk']['Row'][];
  });

  afterEach(cleanup);

  it('should delete existing cache item and reduce count', async () => {
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery({
        query: client
          .from('contact')
          .select('id,username', { count: 'exact' })
          .ilike('username', `${testRunPrefix}%`),

        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });
      const { trigger: deleteContact } = useDeleteMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: 'id',
        onSuccess: () => setSuccess(true),
      });
      const { trigger: deleteWithEmptyOptions } = useDeleteMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: null,
      });
      const { trigger: deleteWithoutOptions } = useDeleteMutation({
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

    renderWithConfig(<Page />, { provider: () => provider });
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

  it('should batch delete', async () => {
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const [error, setError] = useState<boolean>(false);

      const { data, count } = useQuery({
        query: client
          .from('contact')
          .select('id,username', { count: 'exact' })
          .ilike('username', `${testRunPrefix}%`),

        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const { trigger: deleteContact } = useDeleteMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: null,
        onSuccess: () => setSuccess(true),

        onError: (e) => {
          setError(true);
        },
      });

      return (
        <div>
          <div
            data-testid="batchDelete"
            onClick={async () => {
              for (const contact of contacts ?? []) {
                await deleteContact({
                  id: contact.id,
                });
              }
            }}
          />
          {(data ?? []).map((d) => (
            <span key={d.id}>{d.username}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
          <span data-testid="error">{`error: ${error}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    await screen.findByText(
      `count: ${contacts.length}`,
      {},
      { timeout: 10000 },
    );

    fireEvent.click(screen.getByTestId('batchDelete'));

    await screen.findByText(`count: 0`, {}, { timeout: 10000 });
    await screen.findByText('success: true', {}, { timeout: 10000 });
    await screen.findByText('error: false', {}, { timeout: 10000 });
  });

  it('should batch delete with multi pks', async () => {
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const [error, setError] = useState<boolean>(false);

      const { data, count } = useQuery({
        query: client
          .from('multi_pk')
          .select('id_1,id_2,name', { count: 'exact' })
          .ilike('name', `${testRunPrefix}%`),

        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const { trigger: deleteMultiPk } = useDeleteMutation({
        query: client.from('multi_pk'),
        primaryKeys: ['id_1', 'id_2'],
        returning: null,
        onSuccess: () => setSuccess(true),

        onError: (e) => {
          console.error(e);
          setError(true);
        },
      });

      return (
        <div>
          <div
            data-testid="batchDelete"
            onClick={async () => {
              for (const i of multiPks ?? []) {
                await deleteMultiPk({
                  id_1: i.id_1,
                  id_2: i.id_2,
                });
              }
            }}
          />
          {(data ?? []).map((d) => (
            <span key={[d.id_1, d.id_2].join(',')}>{d.name}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
          <span data-testid="error">{`error: ${error}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    await screen.findByText(
      `count: ${contacts.length}`,
      {},
      { timeout: 10000 },
    );

    fireEvent.click(screen.getByTestId('batchDelete'));

    await screen.findByText(`count: 0`, {}, { timeout: 10000 });
    await screen.findByText('success: true', {}, { timeout: 10000 });
    await screen.findByText('error: false', {}, { timeout: 10000 });
  });

  it(
    'should revalidate other tables when revalidateTables is set',
    { timeout: 30000 },
    async () => {
      const USERNAME = `${testRunPrefix}-rev-tables`;
      const NOTE_1 = `${testRunPrefix}-note-1`;
      const NOTE_2 = `${testRunPrefix}-note-2`;

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

      function Page() {
        const [success, setSuccess] = useState<boolean>(false);
        // Query notes - this should be revalidated when we delete the contact
        const { data: notes } = useQuery({
          query: client
            .from('contact_note')
            .select('id,text')
            .ilike('text', `${testRunPrefix}%`),
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        });
        const { trigger: deleteContact } = useDeleteMutation({
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
            <span data-testid="notes">
              {(notes ?? [])
                .map((n) => n.text)
                .sort()
                .join(',')}
            </span>
            <span data-testid="success">{`success: ${success}`}</span>
          </div>
        );
      }

      renderWithConfig(<Page />, { provider: () => provider });
      // Initial state: should show NOTE_1
      await screen.findByText(NOTE_1, {}, { timeout: 10000 });

      // Insert another note directly (not via mutation) - cache won't know about it yet
      await client
        .from('contact_note')
        .insert([{ contact_id: contact!.id, text: NOTE_2 }])
        .throwOnError();

      // Cache still shows only NOTE_1
      await screen.findByText(NOTE_1, {}, { timeout: 10000 });

      // Delete the contact - this should trigger revalidation of contact_note table
      fireEvent.click(screen.getByTestId('delete'));

      // After revalidation, we should see both notes
      await screen.findByText(
        [NOTE_1, NOTE_2].join(','),
        {},
        { timeout: 10000 },
      );
      await screen.findByText('success: true', {}, { timeout: 10000 });
    },
  );
});
