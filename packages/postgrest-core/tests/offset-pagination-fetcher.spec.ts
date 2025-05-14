import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  createOffsetPaginationFetcher,
  createOffsetPaginationHasMoreFetcher,
} from '../src/offset-pagination-fetcher';
import type { Database } from './database.types';
import './utils';

const TEST_PREFIX = 'postgrest-fetcher-offset-pagination-fetcher-';

describe('offset-pagination-fetcher', () => {
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
      .select('*')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });

  describe('direct query', () => {
    describe('createOffsetPaginationFetcher', () => {
      it('should return null if query is undefined', () => {
        expect(
          createOffsetPaginationFetcher(null, {
            decode: () => ({ limit: undefined, offset: undefined }),
            pageSize: 50,
          }),
        ).toEqual(null);
      });

      it('should apply pageSize as limit and offset if both are undefined', async () => {
        const fetcher = createOffsetPaginationFetcher(
          client
            .from('contact')
            .select('username')
            .ilike('username', `${testRunPrefix}%`),
          {
            decode: () => ({ limit: undefined, offset: undefined }),
            pageSize: 2,
          },
        );
        expect(fetcher).toBeDefined();
        const data = await fetcher!('');
        expect(data).toHaveLength(2);
      });

      it('should apply limit and offset from key', async () => {
        const fetcher = createOffsetPaginationFetcher(
          client
            .from('contact')
            .select('username')
            .ilike('username', `${testRunPrefix}%`),
          {
            decode: () => ({ limit: 2, offset: 2 }),
            pageSize: 50,
          },
        );
        expect(fetcher).toBeDefined();
        const data = await fetcher!('');
        expect(data).toHaveLength(1);
        expect(data).toEqual([{ username: `${testRunPrefix}-username-3` }]);
      });
    });

    describe('createOffsetPaginationHasMoreFetcher', () => {
      it('should return null if query is undefined', () => {
        expect(
          createOffsetPaginationHasMoreFetcher(null, {
            decode: () => ({ limit: undefined, offset: undefined }),
            pageSize: 50,
          }),
        ).toEqual(null);
      });

      it('should apply pageSize as limit and offset if both are undefined', async () => {
        const fetcher = createOffsetPaginationHasMoreFetcher(
          client
            .from('contact')
            .select('username')
            .ilike('username', `${testRunPrefix}%`),
          {
            decode: () => ({ limit: undefined, offset: undefined }),
            pageSize: 2,
          },
        );
        expect(fetcher).toBeDefined();
        const { data } = await fetcher!('');
        expect(data).toHaveLength(2);
      });

      it('should apply limit and offset from key', async () => {
        const fetcher = createOffsetPaginationHasMoreFetcher(
          client
            .from('contact')
            .select('username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username'),
          {
            decode: () => ({ limit: 3, offset: 0 }),
            pageSize: 2,
          },
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

  describe('rpc query', () => {
    describe('createOffsetPaginationFetcher', () => {
      it('should return null if query is undefined', () => {
        expect(
          createOffsetPaginationFetcher(null, {
            decode: () => ({
              limit: undefined,
              offset: undefined,
            }),
            pageSize: 50,
            applyToBody: { limit: 'v_limit', offset: 'v_offset' },
          }),
        ).toEqual(null);
      });

      it('should apply pageSize as limit and offset if both are undefined', async () => {
        const fetcher = createOffsetPaginationFetcher(
          client
            .rpc('contacts_offset', { v_username_filter: `${testRunPrefix}%` })
            .select('username'),
          {
            decode: () => ({
              limit: undefined,
              offset: undefined,
            }),
            pageSize: 2,
            applyToBody: { limit: 'v_limit', offset: 'v_offset' },
          },
        );
        expect(fetcher).toBeDefined();
        const data = await fetcher!('');
        expect(data).toHaveLength(2);
      });

      it('should apply limit and offset from key', async () => {
        const fetcher = createOffsetPaginationFetcher(
          client
            .rpc('contacts_offset', { v_username_filter: `${testRunPrefix}%` })
            .select('username'),
          {
            decode: () => ({
              limit: 2,
              offset: 2,
            }),
            pageSize: 50,
            applyToBody: { limit: 'v_limit', offset: 'v_offset' },
          },
        );
        expect(fetcher).toBeDefined();
        const data = await fetcher!('');
        expect(data).toHaveLength(1);
        expect(data).toEqual([{ username: `${testRunPrefix}-username-3` }]);
      });
    });

    describe('createOffsetPaginationHasMoreFetcher', () => {
      it('should return null if query is undefined', () => {
        expect(
          createOffsetPaginationHasMoreFetcher(null, {
            decode: () => ({
              limit: undefined,
              offset: undefined,
            }),
            pageSize: 50,
            applyToBody: { limit: 'v_limit', offset: 'v_offset' },
          }),
        ).toEqual(null);
      });

      it('should apply pageSize as limit and offset if both are undefined', async () => {
        const fetcher = createOffsetPaginationHasMoreFetcher(
          client
            .rpc('contacts_offset', { v_username_filter: `${testRunPrefix}%` })
            .select('username'),
          {
            decode: () => ({
              limit: undefined,
              offset: undefined,
            }),
            pageSize: 2,
            applyToBody: { limit: 'v_limit', offset: 'v_offset' },
          },
        );
        expect(fetcher).toBeDefined();
        const { data } = await fetcher!('');
        expect(data).toHaveLength(2);
      });

      it('should apply limit and offset from key', async () => {
        const fetcher = createOffsetPaginationHasMoreFetcher(
          client
            .rpc('contacts_offset', { v_username_filter: `${testRunPrefix}%` })
            .select('username'),
          {
            decode: () => ({
              limit: 3,
              offset: 0,
            }),
            pageSize: 2,
            applyToBody: { limit: 'v_limit', offset: 'v_offset' },
          },
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
});
