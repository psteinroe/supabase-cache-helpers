import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';

import type { Database } from './database.types';
import './utils';

import { PostgrestParser } from '../dist';
import { buildUpdateFetcher } from '../src/update-fetcher';

const TEST_PREFIX = 'postgrest-fetcher-update-';

describe('update', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contact: Database['public']['Tables']['contact']['Row'] | null;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert({ username: `${testRunPrefix}-username-1` })
      .select('*')
      .throwOnError()
      .single();
    contact = data;
    expect(contact).toBeDefined();
  });

  it('should throw if input does not have a value for all primary keys', async () => {
    await expect(
      buildUpdateFetcher(client.from('contact'), ['id'], {
        queriesForTable: () => [],
      })({}),
    ).rejects.toThrowError('Missing value for primary key id');
  });

  it('should update entity by primary keys', async () => {
    const updatedContact = await buildUpdateFetcher(
      client.from('contact'),
      ['id'],
      { queriesForTable: () => [] },
    )({
      id: contact?.id,
      username: `${testRunPrefix}-username-2`,
    });
    expect(updatedContact).toEqual({
      normalizedData: {
        id: expect.anything(),
        username: `${testRunPrefix}-username-2`,
      },
    });
    const { data } = await client
      .from('contact')
      .select('*')
      .eq('id', contact?.id ?? '')
      .throwOnError()
      .maybeSingle();
    expect(data?.username).toEqual(`${testRunPrefix}-username-2`);
  });

  it('should apply query if provided', async () => {
    const result = await buildUpdateFetcher(client.from('contact'), ['id'], {
      query: 'username',
      queriesForTable: () => [],
    })({
      id: contact?.id,
      username: `${testRunPrefix}-username-3`,
    });
    expect(result).toEqual({
      normalizedData: {
        username: `${testRunPrefix}-username-3`,
      },
      userQueryData: {
        username: `${testRunPrefix}-username-3`,
      },
    });
  });

  it('should use alias if there is one on the pks', async () => {
    const q = client
      .from('contact')
      .select('test:id,username')
      .eq('test', contact!.id);

    const updatedContact = await buildUpdateFetcher(
      client.from('contact'),
      ['id'],
      {
        queriesForTable: () => [new PostgrestParser(q)],
      },
    )({
      id: contact?.id,
      username: `${testRunPrefix}-username-4`,
    });
    expect(updatedContact).toEqual({
      normalizedData: {
        id: expect.anything(),
        username: `${testRunPrefix}-username-4`,
      },
    });
    const { data } = await client
      .from('contact')
      .select('*')
      .eq('id', contact?.id ?? '')
      .throwOnError()
      .maybeSingle();
    expect(data?.username).toEqual(`${testRunPrefix}-username-4`);
  });
});
