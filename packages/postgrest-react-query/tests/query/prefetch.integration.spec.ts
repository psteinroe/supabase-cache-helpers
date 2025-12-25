import { fetchQueryInitialData, prefetchQuery } from '../../src';
import type { Database } from '../database.types';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { beforeAll, describe, expect, it } from 'vitest';
import '../utils';

const TEST_PREFIX = 'postgrest-react-query-prefetch';

describe('prefetch', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ])
      .select('*,has_low_ticket_number')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });

  it('prefetchQuery should throw if query is not a PostgrestBuilder', async () => {
    const queryClient = new QueryClient();
    try {
      await prefetchQuery(queryClient, Promise.resolve({} as any));
    } catch (error) {
      expect(error).toEqual(new Error('Key is not a PostgrestBuilder'));
    }
  });

  it('fetchQueryInitialData should throw if query is not a PostgrestBuilder', async () => {
    try {
      await fetchQueryInitialData(Promise.resolve({} as any));
    } catch (error) {
      expect(error).toEqual(new Error('Query is not a PostgrestBuilder'));
    }
  });
});
