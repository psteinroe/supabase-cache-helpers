import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';

import { createCursorPaginationFetcher } from '../src/cursor-pagination-fetcher';
import type { Database } from './database.types';

import './utils';

const TEST_PREFIX = 'postgrest-fetcher-cursor-pagination-fetcher-';

const CONFIG = {
  orderBy: 'username',
  uqOrderBy: 'id',
};

describe('cursor-pagination-fetcher', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  function getContactId(idx: number) {
    const contact = contacts.find(
      (c) => c.id === `00000000-0000-0000-0000-00000000000${idx}`,
    );
    if (!contact) {
      throw new Error(`Contact with idx ${idx} not found`);
    }
    return contact.id;
  }

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
        {
          username: `${testRunPrefix}-username-1`,
          id: '00000000-0000-0000-0000-000000000001',
        },
        {
          username: `${testRunPrefix}-username-2`,
          id: '00000000-0000-0000-0000-000000000002',
        },
        {
          // duplicate username
          username: `${testRunPrefix}-username-2`,
          id: '00000000-0000-0000-0000-000000000003',
        },
        {
          username: `${testRunPrefix}-username-3`,
          id: '00000000-0000-0000-0000-000000000004',
        },
        {
          username: `${testRunPrefix}-username-4`,
          id: '00000000-0000-0000-0000-000000000005',
        },
      ])
      .select('*')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(5);
  });

  describe('normal query', () => {
    describe('createCursorPaginationFetcher', () => {
      it('should return null if query is undefined', () => {
        expect(
          createCursorPaginationFetcher(
            null,
            () => ({
              orderBy: `${testRunPrefix}-username-2`,
              uqOrderBy: getContactId(2),
            }),
            CONFIG,
          ),
        ).toEqual(null);
      });

      it('should work with no cursor', async () => {
        const fetcher = createCursorPaginationFetcher(
          client
            .from('contact')
            .select('username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true, nullsFirst: false })
            .order('id', { ascending: true, nullsFirst: false })
            .limit(2),
          () => ({}),
          CONFIG,
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
            .ilike('username', `${testRunPrefix}%`)
            .limit(2)
            .order('username', { ascending: true, nullsFirst: false })
            .order('id', { ascending: true, nullsFirst: false }),
          () => ({
            orderBy: `${testRunPrefix}-username-2`,
            uqOrderBy: getContactId(3),
          }),
          CONFIG,
        );
        expect(fetcher).toBeDefined();
        const data = await fetcher!('');
        expect(data).toHaveLength(2);
        expect(data).toEqual([
          { username: `${testRunPrefix}-username-3` },
          { username: `${testRunPrefix}-username-4` },
        ]);
      });

      it('should work descending', async () => {
        const fetcher = createCursorPaginationFetcher(
          client
            .from('contact')
            .select('username')
            .ilike('username', `${testRunPrefix}%`)
            .limit(2)
            .order('username', { ascending: false, nullsFirst: false })
            .order('id', { ascending: false, nullsFirst: false }),

          () => ({
            orderBy: `${testRunPrefix}-username-3`,
            uqOrderBy: getContactId(3),
          }),
          CONFIG,
        );
        expect(fetcher).toBeDefined();
        const data = await fetcher!('');
        expect(data).toHaveLength(2);
        expect(data).toEqual([
          { username: `${testRunPrefix}-username-2` },
          { username: `${testRunPrefix}-username-2` },
        ]);
      });

      it('should work with just ordering on an uq column', async () => {
        const fetcher = createCursorPaginationFetcher(
          client
            .from('contact')
            .select('username')
            .ilike('username', `${testRunPrefix}%`)
            .limit(2)
            .order('id', { ascending: false }),
          () => ({
            orderBy: getContactId(3),
          }),
          { orderBy: 'id' },
        );
        expect(fetcher).toBeDefined();
        const data = await fetcher!('');
        expect(data).toHaveLength(2);
        expect(data).toEqual([
          { username: `${testRunPrefix}-username-2` },
          { username: `${testRunPrefix}-username-1` },
        ]);
      });
    });
  });

  describe('rpc query', () => {
    describe('createCursorPaginationFetcher', () => {
      it('should return null if query is undefined', () => {
        expect(
          createCursorPaginationFetcher(
            null,
            () => ({
              orderBy: `${testRunPrefix}-username-2`,
              uqOrderBy: getContactId(2),
            }),
            CONFIG,
            ({ orderBy, uqOrderBy }) => ({
              v_username_cursor: orderBy,
              v_id_cursor: uqOrderBy,
            }),
          ),
        ).toEqual(null);
      });

      it('should work with no cursor', async () => {
        const fetcher = createCursorPaginationFetcher(
          client
            .rpc('contacts_cursor', {
              v_username_filter: `${testRunPrefix}%`,
              v_limit: 2,
            })
            .select('username'),
          () => ({}),
          CONFIG,
          ({ orderBy, uqOrderBy }) => ({
            v_username_cursor: orderBy,
            v_id_cursor: uqOrderBy,
          }),
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
            .rpc('contacts_cursor', {
              v_username_filter: `${testRunPrefix}%`,
              v_limit: 2,
            })
            .select('username'),
          () => ({
            orderBy: `${testRunPrefix}-username-2`,
            uqOrderBy: getContactId(3),
          }),
          CONFIG,
          ({ orderBy, uqOrderBy }) => ({
            v_username_cursor: orderBy,
            v_id_cursor: uqOrderBy,
          }),
        );
        expect(fetcher).toBeDefined();
        const data = await fetcher!('');
        expect(data).toHaveLength(2);
        expect(data).toEqual([
          { username: `${testRunPrefix}-username-3` },
          { username: `${testRunPrefix}-username-4` },
        ]);
      });

      it('should work with just ordering on an uq column', async () => {
        const fetcher = createCursorPaginationFetcher(
          client
            .rpc('contacts_cursor_id_only', {
              v_username_filter: `${testRunPrefix}%`,
              v_limit: 2,
            })
            .select('username'),
          () => ({
            orderBy: getContactId(3),
          }),
          { orderBy: 'id' },
          ({ orderBy }) => ({
            v_id_cursor: orderBy,
          }),
        );
        expect(fetcher).toBeDefined();
        const data = await fetcher!('');
        expect(data).toHaveLength(2);
        expect(data).toEqual([
          { username: `${testRunPrefix}-username-2` },
          { username: `${testRunPrefix}-username-1` },
        ]);
      });
    });
  });
});
