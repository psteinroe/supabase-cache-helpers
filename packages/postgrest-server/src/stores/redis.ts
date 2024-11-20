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
    let value: Entry<Result> | undefined;
    try {
      const res = await this.redis.get(this.buildCacheKey(key));
      value = JSON.parse(res) as Entry<Result>;
    } catch {
      //
    }

    return value;
  }

  public async set<Result>(key: string, entry: Entry<Result>): Promise<void> {
    await this.redis.set(this.buildCacheKey(key), JSON.stringify(entry));
    await this.redis.pexpireat(this.buildCacheKey(key), entry.staleUntil);
  }

  public async remove(keys: string | string[]): Promise<void> {
    const cacheKeys = (Array.isArray(keys) ? keys : [keys]).map((key) =>
      this.buildCacheKey(key).toString(),
    );
    this.redis.del(...cacheKeys);
  }
}