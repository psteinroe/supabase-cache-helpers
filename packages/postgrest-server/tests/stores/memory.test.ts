import { beforeEach, describe, expect, test } from 'vitest';
import { MemoryStore, Value } from '../../src/stores';

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
});
