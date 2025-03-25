import type { Redis } from 'ioredis';

import type { Entry } from './entry';
import type { Store } from './interface';

export type RedisStoreConfig = {
  redis: Redis;
  prefix?: string;
};

export class RedisStore implements Store {
  private readonly redis: Redis;
  public readonly name = 'redis';
  private readonly prefix: string;

  constructor(config: RedisStoreConfig) {
    this.redis = config.redis;
    this.prefix = config.prefix || 'sbch';
  }

  private buildCacheKey(key: string): string {
    return [this.prefix, key].join('::');
  }

  public async get<Result>(key: string): Promise<Entry<Result> | undefined> {
    const res = await this.redis.get(this.buildCacheKey(key));
    if (!res) return;

    return JSON.parse(res) as Entry<Result>;
  }

  public async set<Result>(key: string, entry: Entry<Result>): Promise<void> {
    await this.redis.set(
      this.buildCacheKey(key),
      JSON.stringify(entry),
      'PXAT',
      entry.staleUntil,
    );
  }

  public async remove(keys: string | string[]): Promise<void> {
    const cacheKeys = (Array.isArray(keys) ? keys : [keys]).map((key) =>
      this.buildCacheKey(key).toString(),
    );
    this.redis.del(...cacheKeys);
  }

  public async removeByPrefix(prefix: string): Promise<void> {
    const pattern = `${prefix}*`;
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }
}
