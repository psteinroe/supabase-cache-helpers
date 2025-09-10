import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';

import { fetchQueryFallbackData } from '../../src';
import type { Database } from '../database.types';
import '../utils';

const TEST_PREFIX = 'postgrest-swr-prefetch';

describe('prefetch', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 1000)}`;
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

  it('should throw if not a postgrest builder', async () => {
    try {
      await fetchQueryFallbackData('' as any);
    } catch (error) {
      expect(error).toEqual(new Error('Query is not a PostgrestBuilder'));
    }
  });
});
