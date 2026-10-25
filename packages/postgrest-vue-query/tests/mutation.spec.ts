import {
  decode,
  encode,
  useDeleteManyMutation,
  useDeleteMutation,
  useInsertMutation,
  useQueriesForTableLoader,
  useQuery,
  useUpdateMutation,
  useUpsertMutation,
} from '../src';
import { database, mount, response, type Row } from './utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach((stop) => stop()));
const one: Row = { id: 1, name: 'one', active: true };
const two: Row = { id: 2, name: 'two', active: true };
const cached = (data: Row[]) => ({
  data,
  count: null,
  error: null,
  status: 200,
  statusText: 'OK',
});

describe('mutations', () => {
  it('does not accumulate filters across repeated or concurrent mutations sharing a table builder', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
      const url = new URL(String(input));
      const row = {
        ...one,
        id: Number(url.searchParams.get('id')?.slice(3)),
        ...JSON.parse(String(init?.body ?? '{}')),
      };
      return response(init?.method === 'PATCH' ? row : []);
    });
    const table = database(fetch).from('items');
    const ctx = mount(() => ({
      update: useUpdateMutation(table, ['id'], 'id,name,active'),
      remove: useDeleteMutation(table, ['id'], 'id,name,active'),
    }));
    cleanups.push(ctx.stop);
    await ctx.result.update.mutateAsync({ id: 1, name: 'first' });
    await ctx.result.update.mutateAsync({ id: 2, name: 'second' });
    await Promise.all([
      ctx.result.update.mutateAsync({ id: 3, name: 'third' }),
      ctx.result.update.mutateAsync({ id: 4, name: 'fourth' }),
    ]);
    await ctx.result.remove.mutateAsync({ id: 1 });
    await ctx.result.remove.mutateAsync({ id: 2 });
    expect(
      fetch.mock.calls.map(([input]) =>
        new URL(String(input)).searchParams.getAll('id'),
      ),
    ).toEqual([['eq.1'], ['eq.2'], ['eq.3'], ['eq.4'], ['in.(1)'], ['in.(2)']]);
    expect(table.url.search).toBe('');
    expect(table.headers.get('Accept')).toBeNull();
  });

  it('inserts, updates, upserts and deletes using real core fetchers and filter-aware caches', async () => {
    let rows = [one];
    const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
      const url = new URL(String(input));
      const payload = init?.body ? JSON.parse(String(init.body)) : undefined;
      let changed: Row[];
      if (init?.method === 'PATCH') {
        const id = Number(url.searchParams.get('id')?.slice(3));
        changed = rows
          .filter((r) => r.id === id)
          .map((r) => ({ ...r, ...payload }));
        rows = rows.map((r) => changed.find((c) => c.id === r.id) ?? r);
      } else if (init?.method === 'DELETE') {
        const filter = url.searchParams.get('id') ?? '';
        const ids = filter.startsWith('in.')
          ? filter.slice(4, -1).split(',').map(Number)
          : [Number(filter.slice(3))];
        changed = rows.filter((r) => ids.includes(r.id));
        rows = rows.filter((r) => !ids.includes(r.id));
      } else {
        changed = payload;
        rows = [
          ...rows.filter((r) => !changed.some((c) => c.id === r.id)),
          ...changed,
        ];
      }
      const headers = new Headers(init?.headers);
      return response(
        headers.get('Accept')?.includes('object') ? changed[0] : changed,
      );
    });
    const db = database(fetch);
    const ctx = mount(() => ({
      insert: useInsertMutation(db.from('items'), ['id'], 'id,name,active'),
      update: useUpdateMutation(db.from('items'), ['id'], 'id,name,active'),
      upsert: useUpsertMutation(db.from('items'), ['id'], 'id,name,active'),
      remove: useDeleteMutation(db.from('items'), ['id'], 'id,name,active'),
      removeMany: useDeleteManyMutation(
        db.from('items'),
        ['id'],
        'id,name,active',
      ),
    }));
    cleanups.push(ctx.stop);
    const all = encode(
      db.from('items').select('id,name,active').order('id'),
      false,
    );
    const active = encode(
      db.from('items').select('id,name,active').eq('active', true).order('id'),
      false,
    );
    ctx.client.setQueryData(all, cached([one]));
    ctx.client.setQueryData(active, cached([one]));
    const data = (key: string[]) =>
      ctx.client.getQueryData<{ data: Row[] }>(key)?.data;
    const onSuccess = vi.fn(() => expect(data(all)).toEqual([one, two]));
    expect(await ctx.result.insert.mutateAsync([two], { onSuccess })).toEqual([
      two,
    ]);
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(data(active)).toEqual([one, two]);
    await ctx.result.update.mutateAsync({ id: 2, active: false });
    expect(data(all)?.[1]?.active).toBe(false);
    expect(data(active)).toEqual([one]);
    await ctx.result.upsert.mutateAsync([{ ...two, name: 'updated' }]);
    expect(data(active)?.[1]?.name).toBe('updated');
    await ctx.result.remove.mutateAsync({ id: 1 });
    expect(data(all)?.map((r) => r.id)).toEqual([2]);
    await ctx.result.removeMany.mutateAsync([{ id: 2 }]);
    expect(data(all)).toEqual([]);
    expect(data(active)).toEqual([]);
    expect(fetch.mock.calls.map(([, init]) => init?.method)).toEqual([
      'POST',
      'PATCH',
      'POST',
      'DELETE',
      'DELETE',
    ]);
  });

  it('invalidates range, total and singleton caches without guessing rows or totals', async () => {
    const db = database(vi.fn(async () => response([two])));
    const ctx = mount(() => ({
      insert: useInsertMutation(db.from('items'), ['id'], 'id,name,active'),
      remove: useDeleteMutation(db.from('items'), ['id'], 'id,name,active'),
    }));
    cleanups.push(ctx.stop);
    const builders = [
      db.from('items').select('id,name,active').range(2, 3),
      db.from('items').select('id,name,active').limit(1),
      db.from('items').select('id,name,active', { count: 'exact' }),
      db.from('items').select('id,name,active').eq('id', 2).maybeSingle(),
    ];
    const keys = builders.map((b) => encode(b, false));
    keys.forEach((key, i) =>
      ctx.client.setQueryData(
        key,
        i === 3 ? { ...cached([]), data: null } : cached([one]),
      ),
    );
    const before = keys.map((key) => ctx.client.getQueryData(key));
    await ctx.result.insert.mutateAsync([two]);
    keys.forEach((key, i) => {
      expect(ctx.client.getQueryState(key)?.isInvalidated).toBe(true);
      expect(ctx.client.getQueryData(key)).toEqual(before[i]);
    });
    await ctx.result.remove.mutateAsync({ id: 2 });
    keys.forEach((key, i) =>
      expect(ctx.client.getQueryData(key)).toEqual(before[i]),
    );
  });

  it('keeps cached data unchanged on request failure and rejects missing primary keys', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(
          JSON.stringify({
            message: 'conflict',
            code: '23505',
            details: '',
            hint: '',
          }),
          { status: 409 },
        ),
    );
    const db = database(fetch);
    const ctx = mount(() => ({
      insert: useInsertMutation(db.from('items'), ['id']),
      update: useUpdateMutation(db.from('items'), ['id']),
    }));
    cleanups.push(ctx.stop);
    const key = encode(db.from('items').select('id,name,active'), false);
    ctx.client.setQueryData(key, cached([one]));
    await expect(ctx.result.insert.mutateAsync([two])).rejects.toMatchObject({
      code: '23505',
    });
    expect(ctx.client.getQueryData(key)).toEqual(cached([one]));
    await expect(
      ctx.result.update.mutateAsync({ name: 'missing' }),
    ).rejects.toThrow('Missing value for primary key id');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('refetches active page boundaries and exact totals before mutation success', async () => {
    let rows = [one];
    const fetch = vi.fn<typeof globalThis.fetch>(async (_input, init) => {
      if (init?.method === 'POST') {
        const added = JSON.parse(String(init.body)) as Row[];
        rows = [...rows, ...added].sort((a, b) => a.id - b.id);
        return response(added);
      }
      return response(rows.slice(0, 1), rows.length);
    });
    const db = database(fetch);
    const ctx = mount(() => ({
      query: useQuery(() =>
        db
          .from('items')
          .select('id,name,active', { count: 'exact' })
          .order('id')
          .range(0, 0),
      ),
      insert: useInsertMutation(db.from('items'), ['id'], 'id,name,active'),
    }));
    cleanups.push(ctx.stop);
    await vi.waitFor(() => expect(ctx.result.query.data.value).toEqual([one]));
    const zero = { ...two, id: 0 };
    await ctx.result.insert.mutateAsync([zero]);
    expect(ctx.result.query.data.value).toEqual([zero]);
    expect(ctx.result.query.count.value).toBe(2);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('isolates schemas during mutation query expansion and ignores malformed keys', () => {
    const db = database(vi.fn());
    const ctx = mount(() => useQueriesForTableLoader('items', 'public'));
    cleanups.push(ctx.stop);
    const key = encode(db.from('items').select('id'), false);
    const other = encode(db.from('items').select('name'), false);
    other[2] = 'private';
    ctx.client.setQueryData(key, cached([]));
    ctx.client.setQueryData(other, cached([]));
    ctx.client.setQueryData(['postgrest'], cached([]));
    expect(ctx.result()).toHaveLength(1);
    expect(ctx.result()[0].paths.map((p) => p.path)).toEqual(['id']);
    expect(decode(['postgrest'])).toBeNull();
    expect(decode(['unrelated'])).toBeNull();
  });
});
