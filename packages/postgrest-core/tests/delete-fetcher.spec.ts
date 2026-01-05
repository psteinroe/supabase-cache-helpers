import { PostgrestParser } from '../src';
import { buildDeleteFetcher } from '../src/delete-fetcher';
import type { Database } from './database.types';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import './utils';
import { beforeAll, describe, expect, it } from 'vitest';

const TEST_PREFIX = 'postgrest-fetcher-delete-';

describe('delete', () => {
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
  it('should throw if input does not have a value for all primary keys', async () => {
    await expect(
      buildDeleteFetcher(client.from('contact'), ['id'], {
        queriesForTable: () => [],
      })([{ username: 'test' }]),
    ).rejects.toThrowError('Missing value for primary key id');
  });

  it('should delete entity by primary keys', async () => {
    const { data: contact } = await client
      .from('contact')
      .insert({ username: `${testRunPrefix}-test` })
      .select('id')
      .throwOnError()
      .single();
    expect(contact?.id).toBeDefined();
    const deletedContact = await buildDeleteFetcher(
      client.from('contact'),
      ['id'],
      {
        queriesForTable: () => [],
      },
    )([
      {
        id: contact?.id,
      },
    ]);
    expect(deletedContact).toEqual(null);
    const { data } = await client
      .from('contact')
      .select('*')
      .eq('id', contact?.id ?? '')
      .throwOnError()
      .maybeSingle();
    expect(data).toEqual(null);
  });

  it('should return primary keys if there is are least one query on that table', async () => {
    const { data: contact } = await client
      .from('contact')
      .insert({ username: `${testRunPrefix}-test` })
      .select('id')
      .throwOnError()
      .single();
    expect(contact?.id).toBeDefined();
    const deletedContact = await buildDeleteFetcher(
      client.from('contact'),
      ['id'],
      {
        queriesForTable: () => [{ paths: [], filters: [] }],
      },
    )([
      {
        id: contact?.id,
      },
    ]);
    expect(deletedContact).toEqual([
      {
        normalizedData: { id: contact?.id },
      },
    ]);
  });

  it('should apply query if provided', async () => {
    const { data: contact } = await client
      .from('contact')
      .insert({ username: `${testRunPrefix}-test`, ticket_number: 1234 })
      .select('id')
      .throwOnError()
      .single();
    expect(contact?.id).toBeDefined();
    const result = await buildDeleteFetcher(client.from('contact'), ['id'], {
      query: 'ticket_number',
      queriesForTable: () => [],
    })([
      {
        id: contact?.id,
      },
    ]);
    expect(result).toEqual([
      {
        normalizedData: { id: contact?.id, ticket_number: 1234 },
        userQueryData: { ticket_number: 1234 },
      },
    ]);
  });

  it('should delete multiple entities by primary keys', async () => {
    const { data: contacts } = await client
      .from('contact')
      .insert([
        { username: `${testRunPrefix}-test-1` },
        { username: `${testRunPrefix}-test-2` },
      ])
      .select('id')
      .throwOnError();

    expect(contacts).toBeDefined();
    expect(contacts!.length).toEqual(2);

    const deletedContact = await buildDeleteFetcher(
      client.from('contact'),
      ['id'],
      {
        queriesForTable: () => [],
      },
    )((contacts ?? []).map((c) => ({ id: c.id })));

    expect(deletedContact).toEqual(null);

    const { data } = await client
      .from('contact')
      .select('*')
      .in(
        'id',
        (contacts ?? []).map((c) => c.id),
      )
      .throwOnError();

    expect(data).toEqual([]);
  });

  it('should use alias if there is one on the pks', async () => {
    const { data: contact } = await client
      .from('contact')
      .insert({ username: `${testRunPrefix}-test`, ticket_number: 1234 })
      .select('id')
      .throwOnError()
      .single();
    expect(contact?.id).toBeDefined();

    const q = client
      .from('contact')
      .select('test:id,username')
      .eq('test', contact!.id);

    const result = await buildDeleteFetcher(client.from('contact'), ['id'], {
      query: 'ticket_number',
      queriesForTable: () => [new PostgrestParser(q)],
    })([
      {
        id: contact?.id,
      },
    ]);
    expect(result).toEqual([
      {
        normalizedData: {
          id: contact?.id,
          ticket_number: 1234,
        },
        userQueryData: { ticket_number: 1234 },
      },
    ]);
  });
});
