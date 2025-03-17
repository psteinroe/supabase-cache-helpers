import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { DefaultStatefulContext, QueryCache } from '../src';
import type { Database } from './database.types';
import './utils';
import { MemoryStore } from '../src/stores';

const TEST_PREFIX = 'postgrest-server-query';

const ctx = new DefaultStatefulContext();

describe('QueryCache', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
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
      .select('*')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });
  beforeEach(() => {
    provider = new Map();
  });

  describe('.query()', () => {
    it('should work for single', async () => {
      const map = new Map();

      const cache = new QueryCache(ctx, {
        stores: [new MemoryStore({ persistentMap: map })],
        fresh: 1000,
        stale: 2000,
      });

      const query = client
        .from('contact')
        .select('id,username')
        .eq('username', contacts[0].username!)
        .single();

      const spy = vi.spyOn(query, 'then');

      const res = await cache.query(query);

      const res2 = await cache.query(query);

      expect(res.data?.username).toEqual(contacts[0].username);
      expect(res2.data?.username).toEqual(contacts[0].username);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should work for maybeSingle', async () => {
      const map = new Map();

      const cache = new QueryCache(ctx, {
        stores: [new MemoryStore({ persistentMap: map })],
        fresh: 1000,
        stale: 2000,
      });

      const query = client
        .from('contact')
        .select('id,username')
        .eq('username', contacts[0].username!)
        .maybeSingle();

      const spy = vi.spyOn(query, 'then');

      const res = await cache.query(query);

      const res2 = await cache.query(query);

      expect(res.data?.username).toEqual(contacts[0].username);
      expect(res2.data?.username).toEqual(contacts[0].username);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should work for multiple', async () => {
      const map = new Map();

      const cache = new QueryCache(ctx, {
        stores: [new MemoryStore({ persistentMap: map })],
        fresh: 1000,
        stale: 2000,
      });

      const query = client
        .from('contact')
        .select('id,username', { count: 'exact' })
        .ilike('username', `${testRunPrefix}%`);

      const spy = vi.spyOn(query, 'then');

      const res = await cache.query(query);

      const res2 = await cache.query(query);

      expect(res.count).toEqual(4);
      expect(res2.count).toEqual(4);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not store result if store() returns false', async () => {
      const map = new Map();

      const cache = new QueryCache(ctx, {
        stores: [new MemoryStore({ persistentMap: map })],
        fresh: 1000,
        stale: 2000,
      });

      const query = client
        .from('contact')
        .select('id,username')
        .eq('username', contacts[0].username!)
        .maybeSingle();

      const spy = vi.spyOn(query, 'then');

      const res = await cache.query(query, { store: () => false });

      const res2 = await cache.query(query);

      expect(res.data?.username).toEqual(contacts[0].username);
      expect(res2.data?.username).toEqual(contacts[0].username);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should store result if store() returns true', async () => {
      const map = new Map();

      const cache = new QueryCache(ctx, {
        stores: [new MemoryStore({ persistentMap: map })],
        fresh: 1000,
        stale: 2000,
      });

      const query = client
        .from('contact')
        .select('id,username')
        .eq('username', contacts[0].username!)
        .maybeSingle();

      const spy = vi.spyOn(query, 'then');

      const res = await cache.query(query, { store: () => true });

      const res2 = await cache.query(query);

      expect(res.data?.username).toEqual(contacts[0].username);
      expect(res2.data?.username).toEqual(contacts[0].username);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('.swr()', () => {
    it('should work for single', async () => {
      const map = new Map();

      const cache = new QueryCache(ctx, {
        stores: [new MemoryStore({ persistentMap: map })],
        fresh: 1000,
        stale: 2000,
      });

      const query = client
        .from('contact')
        .select('id,username')
        .eq('username', contacts[0].username!)
        .single();

      const spy = vi.spyOn(query, 'then');

      const res = await cache.swr(query);

      const res2 = await cache.swr(query);

      expect(res.data?.username).toEqual(contacts[0].username);
      expect(res2.data?.username).toEqual(contacts[0].username);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should work for maybeSingle', async () => {
      const map = new Map();

      const cache = new QueryCache(ctx, {
        stores: [new MemoryStore({ persistentMap: map })],
        fresh: 1000,
        stale: 2000,
      });

      const query = client
        .from('contact')
        .select('id,username')
        .eq('username', contacts[0].username!)
        .maybeSingle();

      const spy = vi.spyOn(query, 'then');

      const res = await cache.swr(query);

      const res2 = await cache.swr(query);

      expect(res.data?.username).toEqual(contacts[0].username);
      expect(res2.data?.username).toEqual(contacts[0].username);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should work for multiple', async () => {
      const map = new Map();

      const cache = new QueryCache(ctx, {
        stores: [new MemoryStore({ persistentMap: map })],
        fresh: 1000,
        stale: 2000,
      });

      const query = client
        .from('contact')
        .select('id,username', { count: 'exact' })
        .ilike('username', `${testRunPrefix}%`);

      const spy = vi.spyOn(query, 'then');

      const res = await cache.swr(query);

      const res2 = await cache.swr(query);

      expect(res.count).toEqual(4);
      expect(res2.count).toEqual(4);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('should dedupe', async () => {
    const map = new Map();

    const cache = new QueryCache(ctx, {
      stores: [new MemoryStore({ persistentMap: map })],
      fresh: 1000,
      stale: 2000,
    });

    const query = client
      .from('contact')
      .select('id,username', { count: 'exact' })
      .ilike('username', `${testRunPrefix}%`);

    const spy = vi.spyOn(query, 'then');

    const p1 = cache.query(query);
    const p2 = cache.query(query);

    await Promise.all([p1, p2]);

    // TOOD figure out how we can test this from the outside
    // i confirmed that this works via manual testing with logs
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
