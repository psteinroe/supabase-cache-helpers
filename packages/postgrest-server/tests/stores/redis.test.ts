import { RedisStore, Value } from '../../src/stores';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Redis } from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

const createCacheValue = (value: string): Value<string> => ({
  data: value,
  error: null,
  count: 0,
  status: 200,
  statusText: 'OK',
});

describe('RedisStore', () => {
  let container: StartedRedisContainer;
  let redis: Redis;
  let redisStore: RedisStore;

  beforeAll(async () => {
    container = await new RedisContainer('redis:7-alpine').start();
    redis = new Redis(container.getConnectionUrl());
  }, 60000);

  afterAll(async () => {
    await redis.quit();
    await container.stop();
  });

  beforeEach(async () => {
    redisStore = new RedisStore({ redis, prefix: 'test' });
    await redis.flushall();
  });

  test('should store value in the cache', async () => {
    const key = 'key';
    const entry = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    await redisStore.set(key, entry);
    expect(await redisStore.get(key)).toEqual(entry);
  });

  test('should return undefined if key does not exist in cache', async () => {
    expect(await redisStore.get('doesnotexist')).toEqual(undefined);
  });

  test('should remove value from cache', async () => {
    const entry = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 10000000,
      staleUntil: Date.now() + 12312412512515,
    };
    await redisStore.set('key', entry);
    await redisStore.remove('key');
    expect(await redisStore.get('key')).toEqual(undefined);
  });

  test('should remove keys by prefix', async () => {
    const entry = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    await redisStore.set('public$posts$select=*', entry);
    await redisStore.set('public$posts$user_id=eq.5', entry);
    await redisStore.set('public$comments$select=*', entry);

    // Note: removeByPrefix expects the full key pattern including store prefix
    await redisStore.removeByPrefix('test::public$posts$');

    expect(await redisStore.get('public$posts$select=*')).toBeUndefined();
    expect(await redisStore.get('public$posts$user_id=eq.5')).toBeUndefined();
    expect(await redisStore.get('public$comments$select=*')).toBeDefined();
  });

  test('should remove keys by glob pattern', async () => {
    const entry = {
      value: createCacheValue('name'),
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    await redisStore.set('public$posts$select=*&user_id=eq.5', entry);
    await redisStore.set('public$posts$select=*&user_id=eq.10', entry);
    await redisStore.set('public$posts$select=*&status=eq.active', entry);

    // Pattern: match keys containing user_id=eq.5
    await redisStore.removeByPattern('public$posts$*user_id=eq.5*');

    expect(
      await redisStore.get('public$posts$select=*&user_id=eq.5'),
    ).toBeUndefined();
    expect(
      await redisStore.get('public$posts$select=*&user_id=eq.10'),
    ).toBeDefined();
    expect(
      await redisStore.get('public$posts$select=*&status=eq.active'),
    ).toBeDefined();
  });
});
