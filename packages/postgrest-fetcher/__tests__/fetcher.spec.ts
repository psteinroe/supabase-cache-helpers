import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { fetcher } from '../src';
import { Database } from './database.types';
import './utils';

const TEST_PREFIX = 'postgrest-fetcher-fetch-';

describe('fetcher', () => {
  let client: SupabaseClient<Database, 'public', Database['public']>;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
      ])
      .select('*')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(2);
  });

  it('should fetch', async () => {
    await expect(
      fetcher(
        client
          .from('contact')
          .select('username', { count: 'exact' })
          .eq('username', `${testRunPrefix}-username-1`)
      )
    ).resolves.toEqual({
      data: [{ username: `${testRunPrefix}-username-1` }],
      count: 1,
      error: null,
      status: 200,
      statusText: 'OK',
    });
  });

  it('should throw on error', async () => {
    await expect(
      fetcher(
        client
          .from('contact')
          .select('username', { count: 'exact' })
          .eq('unknown', `${testRunPrefix}-username-1`)
      )
    ).rejects.toEqual({
      code: '42703',
      details: null,
      hint: null,
      message: 'column contact.unknown does not exist',
    });
  });
});
