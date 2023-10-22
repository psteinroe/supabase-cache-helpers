import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { buildDeleteFetcher } from '../src/delete-fetcher';
import { Database } from './database.types';
import './utils';

const TEST_PREFIX = 'postgrest-fetcher-delete-';

describe('delete', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
  });
  it('should throw if input does not have a value for all primary keys', async () => {
    await expect(
      buildDeleteFetcher(client.from('contact'), ['id'], {
        queriesForTable: () => [],
      })({})
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
      }
    )({
      id: contact?.id,
    });
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
      }
    )({
      id: contact?.id,
    });
    expect(deletedContact).toEqual({
      normalizedData: { id: contact?.id },
    });
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
    })({
      id: contact?.id,
    });
    expect(result).toEqual({
      normalizedData: { id: contact?.id },
      userQueryData: { ticket_number: 1234 },
    });
  });
});
