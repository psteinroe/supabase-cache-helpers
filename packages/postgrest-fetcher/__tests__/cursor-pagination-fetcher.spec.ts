import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import './utils';

import { createCursorPaginationFetcher } from '../src';

const TEST_PREFIX = 'postgrest-fetcher-cursor-pagination-fetcher-';

describe('cursor-pagination-fetcher', () => {
  let client: SupabaseClient<Database>;
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
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ])
      .select('*')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });

  describe('createCursorPaginationFetcher', () => {
    it('should return null if query is undefined', () => {
      expect(
        createCursorPaginationFetcher(
          null,
          {
            order: { column: 'username', ascending: true, nullsFirst: false },
            pageSize: 2,
          },
          (key) => ({
            cursor: `${testRunPrefix}-username-2`,
          })
        )
      ).toEqual(null);
    });

    it('should work with no cursor', async () => {
      const fetcher = createCursorPaginationFetcher(
        client
          .from('contact')
          .select('username')
          .ilike('username', `${testRunPrefix}%`),
        {
          order: { column: 'username', ascending: true, nullsFirst: false },
          pageSize: 2,
        },
        () => ({
          cursor: undefined,
        })
      );
      expect(fetcher).toBeDefined();
      const data = await fetcher!('');
      expect(data).toHaveLength(2);
      expect(data).toEqual([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
      ]);
    });

    it('should apply cursor from key', async () => {
      const fetcher = createCursorPaginationFetcher(
        client
          .from('contact')
          .select('username')
          .ilike('username', `${testRunPrefix}%`),
        {
          order: { column: 'username', ascending: true, nullsFirst: false },
          pageSize: 2,
        },
        (key) => ({
          cursor: `${testRunPrefix}-username-2`,
        })
      );
      expect(fetcher).toBeDefined();
      const data = await fetcher!('');
      expect(data).toHaveLength(2);
      expect(data).toEqual([
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ]);
    });
  });
});
