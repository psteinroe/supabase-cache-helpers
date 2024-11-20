import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, test } from 'vitest';
import { DefaultStatefulContext } from '../src/context';
import { MemoryStore, Value } from '../src/stores';
import { SwrCache } from '../src/swr-cache';

const fresh = 1000;
const stale = 2000;
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
  await cache.set<string>(key, createCacheValue(value));
  expect((await cache.get(key))?.data).toEqual(value);
});

test('should return undefined if key does not exist in cache', async () => {
  expect(await cache.get('doesnotexist')).toEqual(undefined);
});

test('should remove value from cache', async () => {
  await cache.set(key, createCacheValue(value));
  await cache.remove(key);
  expect(await cache.get(key)).toEqual(undefined);
});

test('evicts outdated data', async () => {
  await cache.set(key, createCacheValue(value));
  await new Promise((r) => setTimeout(r, 3000));
  const res = await cache.get(key);
  expect(res).toEqual(undefined);
});

test('returns stale data', async () => {
  await cache.set(key, createCacheValue(value));
  await new Promise((r) => setTimeout(r, 1500));
  const res = await cache.get(key);
  expect(res?.data).toEqual(value);
});

describe('with fresh data', () => {
  test('does not fetch from origin', async () => {
    await cache.set(key, createCacheValue(value));
    await new Promise((r) => setTimeout(r, 500));

    let fetchedFromOrigin = false;
    const stale = await cache.swr(key, () => {
      fetchedFromOrigin = true;
      return Promise.resolve(createCacheValue('fresh_data'));
    });
    expect(stale?.data).toEqual(value);

    await new Promise((r) => setTimeout(r, 500));
    const res = await cache.get(key);
    expect(res?.data).toEqual(value);
    expect(fetchedFromOrigin).toBe(false);
  });
});

describe('with stale data', () => {
  test('fetches from origin', async () => {
    await cache.set(key, createCacheValue(value));
    await new Promise((r) => setTimeout(r, 1500));
    const stale = await cache.swr(key, () =>
      Promise.resolve(createCacheValue('fresh_data')),
    );
    expect(stale?.data).toEqual(value);

    await new Promise((r) => setTimeout(r, 1500));
    const res = await cache.get(key);
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
      const res = await cache.swr(key, async () => {
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
