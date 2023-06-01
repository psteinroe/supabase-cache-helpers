import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import './utils';

import {
  createPaginationFetcher,
  createPaginationHasMoreFetcher,
} from '../src';

const TEST_PREFIX = 'postgrest-fetcher-pagination-fetcher-';

describe('pagination-fetcher', () => {
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

  describe('createPaginationFetcher', () => {
    it('should return null if query is undefined', () => {
      expect(
        createPaginationFetcher(
          null,
          (key) => ({
            limit: undefined,
            offset: undefined,
          }),
          50
        )
      ).toEqual(null);
    });

    it('should apply pageSize as limit and offset if both are undefined', async () => {
      const fetcher = createPaginationFetcher(
        client
          .from('contact')
          .select('username')
          .ilike('username', `${testRunPrefix}%`),
        (key) => ({
          limit: undefined,
          offset: undefined,
        }),
        2
      );
      expect(fetcher).toBeDefined();
      const data = await fetcher!('');
      expect(data).toHaveLength(2);
    });

    it('should apply limit and offset from key', async () => {
      const fetcher = createPaginationFetcher(
        client
          .from('contact')
          .select('username')
          .ilike('username', `${testRunPrefix}%`),
        (key) => ({
          limit: 2,
          offset: 2,
        }),
        50
      );
      expect(fetcher).toBeDefined();
      const data = await fetcher!('');
      expect(data).toHaveLength(1);
      expect(data).toEqual([{ username: `${testRunPrefix}-username-3` }]);
    });
  });

  describe('createPaginationHasMoreFetcher', () => {
    it('should return null if query is undefined', () => {
      expect(
        createPaginationHasMoreFetcher(
          null,
          (key) => ({
            limit: undefined,
            offset: undefined,
          }),
          50
        )
      ).toEqual(null);
    });

    it('should apply pageSize as limit and offset if both are undefined', async () => {
      const fetcher = createPaginationHasMoreFetcher(
        client
          .from('contact')
          .select('username')
          .ilike('username', `${testRunPrefix}%`),
        (key) => ({
          limit: undefined,
          offset: undefined,
        }),
        2
      );
      expect(fetcher).toBeDefined();
      const { data } = await fetcher!('');
      expect(data).toHaveLength(2);
    });

    it('should apply limit and offset from key', async () => {
      const fetcher = createPaginationHasMoreFetcher(
        client
          .from('contact')
          .select('username')
          .ilike('username', `${testRunPrefix}%`)
          .order('username'),
        (key) => ({
          limit: 3,
          offset: 0,
        }),
        2
      );
      expect(fetcher).toBeDefined();
      const { data, hasMore } = await fetcher!('');
      expect(data).toHaveLength(2);
      expect(data).toEqual([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
      ]);
      expect(hasMore).toEqual(true);
    });
  });
});
