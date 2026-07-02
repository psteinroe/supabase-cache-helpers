import { DefaultStatefulContext } from '../src/context';
import { MemoryStore, Value } from '../src/stores';
import { SwrCache } from '../src/swr-cache';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, test } from 'vitest';

const fresh = 1000;
const stale = 2000;
const namespace = 'public$posts';
const key = 'key';
const value = randomUUID();

let cache: SwrCache;

const createCacheValue = (value: string): Value<string> => ({
  data: value,
  error: null,
  count: 0,
  status: 200,
  statusText: 'OK',
});

beforeEach(() => {
  const memoryStore = new MemoryStore({ persistentMap: new Map() });
  cache = new SwrCache({
    ctx: new DefaultStatefulContext(),
    store: memoryStore,
    fresh,
    stale,
  });
});

test('should store value in the cache', async () => {
  await cache.set<string>(namespace, key, createCacheValue(value));
  expect((await cache.get(namespace, key))?.data).toEqual(value);
});

test('should return undefined if key does not exist in cache', async () => {
  expect(await cache.get(namespace, 'doesnotexist')).toEqual(undefined);
});

test('should remove value from cache', async () => {
  await cache.set(namespace, key, createCacheValue(value));
  await cache.remove(namespace, key);
  expect(await cache.get(namespace, key)).toEqual(undefined);
});

test('should remove values by prefix', async () => {
  await cache.set(namespace, 'prefix$key1', createCacheValue('value1'));
  await cache.set(namespace, 'prefix$key2', createCacheValue('value2'));
  await cache.set(namespace, 'other$key3', createCacheValue('value3'));

  await cache.removeByPrefix(namespace, 'prefix$');

  expect(await cache.get(namespace, 'prefix$key1')).toEqual(undefined);
  expect(await cache.get(namespace, 'prefix$key2')).toEqual(undefined);
  expect((await cache.get(namespace, 'other$key3'))?.data).toEqual('value3');
});

test('should remove values by pattern', async () => {
  await cache.set(
    namespace,
    'public$posts$user_id=eq.5&select=*',
    createCacheValue('v1'),
  );
  await cache.set(
    namespace,
    'public$posts$user_id=eq.10&select=*',
    createCacheValue('v2'),
  );
  await cache.set(
    namespace,
    'public$posts$status=eq.active',
    createCacheValue('v3'),
  );

  await cache.removeByPattern(namespace, 'public$posts$*user_id=eq.5*');

  expect(
    await cache.get(namespace, 'public$posts$user_id=eq.5&select=*'),
  ).toEqual(undefined);
  expect(
    (await cache.get(namespace, 'public$posts$user_id=eq.10&select=*'))?.data,
  ).toEqual('v2');
  expect(
    (await cache.get(namespace, 'public$posts$status=eq.active'))?.data,
  ).toEqual('v3');
});

test('evicts outdated data', async () => {
  await cache.set(namespace, key, createCacheValue(value));
  await new Promise((r) => setTimeout(r, 3000));
  const res = await cache.get(namespace, key);
  expect(res).toEqual(undefined);
});

test('returns stale data', async () => {
  await cache.set(namespace, key, createCacheValue(value));
  await new Promise((r) => setTimeout(r, 1500));
  const res = await cache.get(namespace, key);
  expect(res?.data).toEqual(value);
});

describe('with fresh data', () => {
  test('does not fetch from origin', async () => {
    await cache.set(namespace, key, createCacheValue(value));
    await new Promise((r) => setTimeout(r, 500));

    let fetchedFromOrigin = false;
    const stale = await cache.swr(namespace, key, () => {
      fetchedFromOrigin = true;
      return Promise.resolve(createCacheValue('fresh_data'));
    });
    expect(stale?.data).toEqual(value);

    await new Promise((r) => setTimeout(r, 500));
    const res = await cache.get(namespace, key);
    expect(res?.data).toEqual(value);
    expect(fetchedFromOrigin).toBe(false);
  });
});

describe('with stale data', () => {
  test('fetches from origin', async () => {
    await cache.set(namespace, key, createCacheValue(value));
    await new Promise((r) => setTimeout(r, 1500));
    const stale = await cache.swr(namespace, key, () =>
      Promise.resolve(createCacheValue('fresh_data')),
    );
    expect(stale?.data).toEqual(value);

    await new Promise((r) => setTimeout(r, 1500));
    const res = await cache.get(namespace, key);
    expect(res).toEqual(createCacheValue('fresh_data'));
  });
});

describe('with fresh=0', () => {
  test('revalidates every time', async () => {
    const memoryStore = new MemoryStore({ persistentMap: new Map() });
    const cache = new SwrCache({
      ctx: new DefaultStatefulContext(),
      store: memoryStore,
      fresh: 0,
      stale: 800000,
    });

    let revalidated = 0;
    for (let i = 0; i < 100; i++) {
      const res = await cache.swr(namespace, key, async () => {
        revalidated++;
        return createCacheValue(i.toString());
      });
      if (i > 1) {
        expect(Number(res?.data)).toEqual(i - 1);
      }
    }

    expect(revalidated).toBe(100);
  });
});
