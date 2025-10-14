import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useEffect, useRef, useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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

  afterEach(cleanup);

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

  it('should return an error', async () => {
    const USERNAME_1 = `${testRunPrefix}-2`;
    const USERNAME_2 = `${testRunPrefix}-3`;
    function Page() {
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
      const { trigger: update, error } = useUpdateMutation(
        client.from('contact'),
        ['id'],
        'idonotexist',
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
          <span data-testid="error">{`error: ${!!error}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('count: 0', {}, { timeout: 10000 });

    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText(USERNAME_1, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');

    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText('error: true', {}, { timeout: 10000 });
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

  it('should revalidate existing cache item with wildcard', async () => {
    const USERNAME_1 = `${testRunPrefix}-wildcard-1`;
    const USERNAME_2 = `${testRunPrefix}-wildcard-2`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('*', { count: 'exact' })
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
    await screen.findByText('count: 0');
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText(USERNAME_1, {}, { timeout: 2000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText(USERNAME_2);
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await screen.findByText('success: true');
  });

  it('should revalidate existing cache item with aggregate', async () => {
    const USERNAME_1 = `${testRunPrefix}-aggregate-1`;
    const USERNAME_2 = `${testRunPrefix}-aggregate-2`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data } = useQuery(
        client
          .from('contact')
          .select('id.count()')
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
      const res = (data ? data[0] : null) as any;
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert([{ username: USERNAME_1 }])}
          />
          <div
            data-testid="update"
            onClick={async () => {
              const { data } = await client
                .from('contact')
                .select('id')
                .eq('username', USERNAME_1)
                .single();

              await update({
                id: data!.id,
                username: USERNAME_2,
              });
            }}
          />
          <span data-testid="count">{`count: ${res?.count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('count: 0');
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText('count: 1', {}, { timeout: 2000 });
    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText('count: 1', {}, { timeout: 2000 });
    await screen.findByText('success: true');
  });

  it('should revalidate existing cache item with count and head', async () => {
    const USERNAME_1 = `${testRunPrefix}-count-1`;
    const USERNAME_2 = `${testRunPrefix}-count-2`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('*', { count: 'exact', head: true })
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
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('count: 0');
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText('count: 1');
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

  it('should work with multiple fkeys', async () => {
    const USERNAME = `${testRunPrefix}-multi-fkeys`;
    const NOTE = `${testRunPrefix}-multi-note`;
    const NOTE_UPDATED = `${testRunPrefix}-multi-note-updated`;

    const { data: contact } = await client
      .from('contact')
      .insert({ username: USERNAME })
      .select('id')
      .single()
      .throwOnError();

    const { data: contactNote } = await client
      .from('contact_note')
      .insert({
        contact_id: contact!.id,
        text: NOTE,
      })
      .select('id')
      .single()
      .throwOnError();

    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data } = useQuery(
        client
          .from('contact_note')
          .select(
            'id,text,created_by:contact!contact_note_created_by_contact_id_fkey(id),updated_by:contact!contact_note_updated_by_contact_id_fkey(id)',
          )
          .ilike('text', `${testRunPrefix}-multi-note%`),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );
      const { trigger: update } = useUpdateMutation(
        client.from('contact_note'),
        ['id'],
        'id,text',
        {
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
                id: contactNote!.id,
                text: NOTE_UPDATED,
                created_by_contact_id: contact!.id,
                updated_by_contact_id: contact!.id,
              })
            }
          />
          <span>
            {(data ?? [])
              .map((d) => d.text)
              .sort()
              .join(',')}
          </span>
          <span>
            {(data ?? [])
              .map((d) => (d.created_by?.id ? 'CYES' : 'CNO'))
              .sort()
              .join(',')}
          </span>
          <span>
            {(data ?? [])
              .map((d) => (d.created_by?.id ? 'UYES' : 'UNO'))
              .sort()
              .join(',')}
          </span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText([NOTE].join(','), {}, { timeout: 10000 });
    await screen.findByText('CNO', {}, { timeout: 10000 });
    await screen.findByText('UNO', {}, { timeout: 10000 });

    fireEvent.click(screen.getByTestId('update'));

    await screen.findByText([NOTE_UPDATED].join(','), {}, { timeout: 10000 });
    await screen.findByText('success: true', {}, { timeout: 10000 });
    await screen.findByText('CYES', {}, { timeout: 10000 });
    await screen.findByText('UYES', {}, { timeout: 10000 });
  });

  it('revalidate should not return undefined while validating', async () => {
    const USERNAME = `${testRunPrefix}-revalidate-fetch`;
    const NOTE = `${testRunPrefix}-revalidate-note`;
    const NOTE_UPDATED = `${testRunPrefix}-revalidate-note-updated`;

    const { data: contact } = await client
      .from('contact')
      .insert({ username: USERNAME })
      .select('id')
      .single()
      .throwOnError();

    const { data: contactNote } = await client
      .from('contact_note')
      .insert({
        contact_id: contact!.id,
        text: NOTE,
        updated_by_contact_id: contact!.id,
        created_by_contact_id: contact!.id,
      })
      .select('id')
      .single()
      .throwOnError();

    function Page() {
      const contactDataUndefinedCount = useRef(0);
      const [success, setSuccess] = useState<boolean>(false);
      const { data: contacts } = useQuery(
        client.from('contact').select('id, username'),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );
      const { data } = useQuery(
        client
          .from('contact_note')
          .select('id,text')
          .ilike('text', `${testRunPrefix}-revalidate-note%`),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );
      const { trigger: update } = useUpdateMutation(
        client.from('contact_note'),
        ['id'],
        'id,text',
        {
          onSuccess: () => setSuccess(true),
          onError: (error) => console.error(error),
          revalidateTables: [{ schema: 'public', table: 'contact' }],
        },
      );
      useEffect(() => {
        if (contacts === undefined) {
          contactDataUndefinedCount.current++;
        }
      }, [contacts]);
      return (
        <div>
          <div
            data-testid="update"
            onClick={async () =>
              await update({
                id: contactNote!.id,
                text: NOTE_UPDATED,
              })
            }
          />
          <span>{(contacts ?? []).map((c) => c.username).join(',')}</span>
          <span>
            {(data ?? [])
              .map((d) => d.text)
              .sort()
              .join(',')}
          </span>
          <span data-testid="success">{`success: ${success}`}</span>
          <span data-testid="undefinedCount">{`undefinedCount: ${contactDataUndefinedCount.current}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText([NOTE].join(','), {}, { timeout: 10000 });

    fireEvent.click(screen.getByTestId('update'));

    await screen.findByText([NOTE_UPDATED].join(','), {}, { timeout: 10000 });
    await screen.findByText('success: true', {}, { timeout: 10000 });

    fireEvent.click(screen.getByTestId('update'));
    fireEvent.click(screen.getByTestId('update'));
    fireEvent.click(screen.getByTestId('update'));
    // revalidation should not return undefined while validating. Data should stay stable
    // while rvalidating.
    await screen.findByText('undefinedCount: 1', {}, { timeout: 10000 });
  });
});
