import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, screen } from '@testing-library/react';
import React, { useState } from 'react';

import { useInsertMutation, useQuery, useUpdateMutation } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-swr-update';

describe('useUpdateMutation', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client
      .from('serial_key_table')
      .delete()
      .ilike('value', `${TEST_PREFIX}%`);
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
  });

  beforeEach(() => {
    provider = new Map();
  });

  it('should update existing cache item with serial primary key', async () => {
    const VALUE_1 = `${testRunPrefix}-1`;
    const VALUE_2 = `${testRunPrefix}-2`;

    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('serial_key_table')
          .select('id,value', { count: 'exact' })
          .in('value', [VALUE_1, VALUE_2]),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );
      const { trigger: insert } = useInsertMutation(
        client.from('serial_key_table'),
        ['id'],
      );
      const { trigger: update } = useUpdateMutation(
        client.from('serial_key_table'),
        ['id'],
        null,
        {
          onSuccess: () => setSuccess(true),
        },
      );
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert([{ value: VALUE_1 }])}
          />
          <div
            data-testid="update"
            onClick={async () =>
              await update({
                id: (data ?? []).find((d) => d.value === VALUE_1)?.id,
                value: VALUE_2,
              })
            }
          />
          <span>
            {
              data?.find((d) => [VALUE_1, VALUE_2].includes(d.value ?? ''))
                ?.value
            }
          </span>
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText(VALUE_1, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText(VALUE_2, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });

  it('should update existing cache item', async () => {
    const USERNAME_1 = `${testRunPrefix}-2`;
    const USERNAME_2 = `${testRunPrefix}-3`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('id,username', { count: 'exact' })
          .in('username', [USERNAME_1, USERNAME_2]),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );
      const { trigger: insert } = useInsertMutation(client.from('contact'), [
        'id',
      ]);
      const { trigger: update } = useUpdateMutation(
        client.from('contact'),
        ['id'],
        null,
        {
          onSuccess: () => setSuccess(true),
        },
      );
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert([{ username: USERNAME_1 }])}
          />
          <div
            data-testid="update"
            onClick={async () =>
              await update({
                id: (data ?? []).find((d) => d.username === USERNAME_1)?.id,
                username: USERNAME_2,
              })
            }
          />
          <span>
            {
              data?.find((d) =>
                [USERNAME_1, USERNAME_2].includes(d.username ?? ''),
              )?.username
            }
          </span>
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText(USERNAME_1, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText(USERNAME_2, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });

  it('revalidate relations should work', async () => {
    const USERNAME = `${testRunPrefix}-rev-relations`;
    const USERNAME_UPDATED = `${testRunPrefix}-rev-relations-updated`;
    const NOTE_1 = `${testRunPrefix}-note-1`;
    const NOTE_2 = `${testRunPrefix}-note-2`;

    const { data: contact } = await client
      .from('contact')
      .insert([{ username: USERNAME }])
      .select('id')
      .single()
      .throwOnError();

    await client
      .from('contact_note')
      .insert([{ contact_id: contact!.id, text: NOTE_1 }])
      .throwOnError();

    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data } = useQuery(
        client
          .from('contact_note')
          .select('id,text')
          .ilike('text', `${testRunPrefix}%`),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );
      const { trigger: update } = useUpdateMutation(
        client.from('contact'),
        ['id'],
        null,
        {
          revalidateTables: [{ schema: 'public', table: 'contact_note' }],
          onSuccess: () => setSuccess(true),
          onError: (error) => console.error(error),
        },
      );
      return (
        <div>
          <div
            data-testid="update"
            onClick={async () =>
              await update({
                id: contact!.id,
                username: USERNAME_UPDATED,
              })
            }
          />
          <span>
            {(data ?? [])
              .map((d) => d.text)
              .sort()
              .join(',')}
          </span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText([NOTE_1].join(','), {}, { timeout: 10000 });

    await client
      .from('contact_note')
      .insert([{ contact_id: contact!.id, text: NOTE_2 }])
      .throwOnError();

    await screen.findByText([NOTE_1].join(','), {}, { timeout: 10000 });

    fireEvent.click(screen.getByTestId('update'));

    await screen.findByText([NOTE_1, NOTE_2].join(','), {}, { timeout: 10000 });
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });
});
