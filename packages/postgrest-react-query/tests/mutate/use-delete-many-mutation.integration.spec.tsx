import { useDeleteMutation, useQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const TEST_PREFIX = 'postgrest-react-query-delmany';

describe('useDeleteMutation with multiple: true', () => {
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
              await deleteContact([
                {
                  id: (data ?? []).find((c) => c)?.id,
                },
              ])
            }
          />
          <div
            data-testid="deleteWithEmptyOptions"
            onClick={async () =>
              await deleteWithEmptyOptions([
                {
                  id: (data ?? []).find((c) => c)?.id,
                },
              ])
            }
          />
          <div
            data-testid="deleteWithoutOptions"
            onClick={async () =>
              await deleteWithoutOptions([
                {
                  id: (data ?? []).find((c) => c)?.id,
                },
              ])
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

  it('should delete multiple items at once and revalidate cache', async () => {
    const queryClient = new QueryClient();
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery({
        query: client
          .from('contact')
          .select('id,username', { count: 'exact' })
          .ilike('username', `${testRunPrefix}%`),
      });
      const { mutateAsync: deleteContacts } = useDeleteMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        onSuccess: () => setSuccess(true),
      });
      return (
        <div>
          <div
            data-testid="deleteAll"
            onClick={async () => {
              const items = data ?? [];
              if (items.length >= 2) {
                await deleteContacts([
                  { id: items[0].id },
                  { id: items[1].id },
                ]);
              }
            }}
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
    fireEvent.click(screen.getByTestId('deleteAll'));
    await screen.findByText('success: true', {}, { timeout: 10000 });
    // Should have deleted 2 items at once
    await screen.findByText(
      `count: ${contacts.length - 2}`,
      {},
      { timeout: 10000 },
    );
  });
});
