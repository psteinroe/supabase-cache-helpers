import { MemoryStore, Value } from '../../src/stores';
import { beforeEach, describe, expect, test } from 'vitest';

const createCacheValue = (value: string): Value<string> => ({
  data: value,
  error: null,
  count: 0,
  status: 200,
  statusText: 'OK',
});

describe('MemoryStore', () => {
  let memoryStore: MemoryStore;

  beforeEach(() => {
    memoryStore = new MemoryStore({ persistentMap: new Map() });
  });

  test('should store value in the cache', async () => {
    const key = 'key';
    const entry = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    await memoryStore.set(key, entry);
    expect(await memoryStore.get(key)).toEqual(entry);
  });

  test('should return undefined if key does not exist in cache', async () => {
    expect(await memoryStore.get('doesnotexist')).toEqual(undefined);
  });

  test('should remove value from cache', async () => {
    memoryStore.set('key', {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 10000000,
      staleUntil: Date.now() + 12312412512515,
    });
    memoryStore.remove('key');
    expect(await memoryStore.get('key')).toEqual(undefined);
  });

  test('should respect capacity', async () => {
    const memoryStore = new MemoryStore({
      persistentMap: new Map(),
      capacity: 1,
    });
    const entry1 = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    const entry2 = {
      value: createCacheValue('name2'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    await memoryStore.set('key1', entry1);
    await memoryStore.set('key2', entry2);
    expect(await memoryStore.get('key1')).toBeUndefined();
    expect(await memoryStore.get('key2')).toBeDefined();
  });

  test('should remove keys by prefix', async () => {
    const entry = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    await memoryStore.set('public$posts$select=*', entry);
    await memoryStore.set('public$posts$user_id=eq.5', entry);
    await memoryStore.set('public$comments$select=*', entry);

    await memoryStore.removeByPrefix('public$posts$');

    expect(await memoryStore.get('public$posts$select=*')).toBeUndefined();
    expect(await memoryStore.get('public$posts$user_id=eq.5')).toBeUndefined();
    expect(await memoryStore.get('public$comments$select=*')).toBeDefined();
  });

  test('should remove keys by glob pattern', async () => {
    const entry = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    await memoryStore.set('public$posts$select=*&user_id=eq.5', entry);
    await memoryStore.set('public$posts$select=*&user_id=eq.10', entry);
    await memoryStore.set('public$posts$select=*&status=eq.active', entry);

    // Pattern: match keys containing user_id=eq.5
    await memoryStore.removeByPattern('public$posts$*user_id=eq.5*');

    expect(
      await memoryStore.get('public$posts$select=*&user_id=eq.5'),
    ).toBeUndefined();
    expect(
      await memoryStore.get('public$posts$select=*&user_id=eq.10'),
    ).toBeDefined();
    expect(
      await memoryStore.get('public$posts$select=*&status=eq.active'),
    ).toBeDefined();
  });

  test('should handle escaped glob characters in pattern', async () => {
    const entry = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    // Key with literal * in the value (URL-encoded as %2A)
    await memoryStore.set('public$posts$select=*&name=eq.%2Atest%2A', entry);
    await memoryStore.set('public$posts$select=*&name=eq.other', entry);

    // Pattern with escaped * to match literal %2A (URL-encoded *)
    await memoryStore.removeByPattern('public$posts$*name=eq.%2Atest%2A*');

    expect(
      await memoryStore.get('public$posts$select=*&name=eq.%2Atest%2A'),
    ).toBeUndefined();
    expect(
      await memoryStore.get('public$posts$select=*&name=eq.other'),
    ).toBeDefined();
  });

  test('should handle single-char wildcard in pattern', async () => {
    const entry = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    await memoryStore.set('public$posts$user_id=eq.1', entry);
    await memoryStore.set('public$posts$user_id=eq.2', entry);
    await memoryStore.set('public$posts$user_id=eq.10', entry);

    // Pattern with ? matches single char
    await memoryStore.removeByPattern('public$posts$user_id=eq.?');

    expect(await memoryStore.get('public$posts$user_id=eq.1')).toBeUndefined();
    expect(await memoryStore.get('public$posts$user_id=eq.2')).toBeUndefined();
    expect(await memoryStore.get('public$posts$user_id=eq.10')).toBeDefined();
  });
});
