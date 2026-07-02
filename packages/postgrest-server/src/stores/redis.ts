import type { Entry } from './entry';
import type { Store } from './interface';
import type { Cluster, Redis } from 'ioredis';

// Keep deletion batches bounded so a single pipeline does not become too large.
// This also keeps Redis Cluster pipeline validation and Lua-less command payloads cheap.
const REMOVE_BATCH_SIZE = 500;

export type RedisClient = Redis | Cluster;

export type RedisStoreConfig = {
  redis: RedisClient;
  prefix?: string;
};

export class RedisStore implements Store {
  private readonly redis: RedisClient;
  public readonly name = 'redis';
  private readonly prefix: string;

  constructor(config: RedisStoreConfig) {
    this.redis = config.redis;
    this.prefix = config.prefix || 'sbch';
  }

  private buildCacheKey(namespace: string, key: string): string {
    // The `{namespace}` part is a Redis Cluster hash tag. Redis only hashes the
    // text inside `{...}`, so every value key and index key for the same table
    // namespace lands in the same cluster slot.
    return [this.prefix, `{${namespace}}`, key].join('::');
  }

  private buildIndexKey(namespace: string): string {
    // This sorted set is the namespace-local catalog of cached query keys.
    // Members are logical cache keys, scores are staleUntil timestamps.
    // Keeping this in the same `{namespace}` slot lets us avoid Redis SCAN.
    return [this.prefix, `{${namespace}}`, '__keys'].join('::');
  }

  public async get<Result>(
    namespace: string,
    key: string,
  ): Promise<Entry<Result> | undefined> {
    // Reads go directly to the value key. Expiration is handled by Redis via
    // PXAT, so a missing value is a cache miss.
    const res = await this.redis.get(this.buildCacheKey(namespace, key));
    if (!res) return;

    return JSON.parse(res) as Entry<Result>;
  }

  public async set<Result>(
    namespace: string,
    key: string,
    entry: Entry<Result>,
  ): Promise<void> {
    const indexKey = this.buildIndexKey(namespace);
    const pipeline = this.redis.pipeline();

    // Store the actual cache payload with the same absolute expiration used by
    // the SWR entry. Redis removes this key automatically after staleUntil.
    pipeline.set(
      this.buildCacheKey(namespace, key),
      JSON.stringify(entry),
      'PXAT',
      entry.staleUntil,
    );

    // Add/update the logical cache key in the namespace index. The score mirrors
    // the value key's expiry so we can prune stale index entries cheaply when we
    // later read the index for invalidation.
    pipeline.zadd(indexKey, entry.staleUntil, key);

    await this.execPipeline(pipeline);

    // Best-effort index cleanup: do not make writes wait for pruning. The value
    // key is already stored correctly, and stale index members are also pruned
    // before invalidation reads the index. Catch errors to avoid unhandled
    // promise rejections from this fire-and-forget maintenance command.
    void this.redis
      .zremrangebyscore(indexKey, '-inf', Date.now())
      .catch(() => undefined);
  }

  public async remove(
    namespace: string,
    keys: string | string[],
  ): Promise<void> {
    // Explicit removal must delete both value keys and their namespace-index
    // members, otherwise future prefix/pattern invalidation would see stale keys.
    await this.removeIndexedKeys(
      namespace,
      Array.isArray(keys) ? keys : [keys],
    );
  }

  public async removeByPrefix(
    namespace: string,
    prefix: string,
  ): Promise<void> {
    // Prefix invalidation works against the namespace index instead of Redis
    // keyspace SCAN. The index only contains keys for this table namespace.
    await this.removeIndexedKeysWhere(namespace, (key) =>
      key.startsWith(prefix),
    );
  }

  public async removeByPattern(
    namespace: string,
    pattern: string,
  ): Promise<void> {
    // Filter invalidation is still pattern based because we do not know all user
    // filter dimensions ahead of time. We only pattern-match within one table's
    // indexed keys, avoiding a Redis Cluster-wide scan.
    const regex = this.globToRegex(pattern);

    await this.removeIndexedKeysWhere(namespace, (key) => regex.test(key));
  }

  private async removeIndexedKeysWhere(
    namespace: string,
    predicate: (key: string) => boolean,
  ): Promise<void> {
    const indexKey = this.buildIndexKey(namespace);
    let cursor = '0';

    // Remove expired index members before reading the index. This keeps the
    // namespace catalog bounded even when cache entries expire naturally.
    await this.redis.zremrangebyscore(indexKey, '-inf', Date.now());

    do {
      // ZSCAN pages through the namespace index so invalidating a large table
      // does not load every indexed key into application memory at once. The
      // response is a flat [member, score, member, score, ...] array.
      const [nextCursor, membersAndScores] = await this.redis.zscan(
        indexKey,
        cursor,
        'COUNT',
        REMOVE_BATCH_SIZE,
      );
      const keys: string[] = [];

      for (let i = 0; i < membersAndScores.length; i += 2) {
        const key = membersAndScores[i];

        if (predicate(key)) {
          keys.push(key);
        }
      }

      // Delete each matching page before continuing. This bounds both memory and
      // Redis command size; duplicate ZSCAN results are harmless because DEL and
      // ZREM are idempotent for already-removed keys.
      await this.removeIndexedKeys(namespace, keys);
      cursor = nextCursor;
    } while (cursor !== '0');
  }

  private async removeIndexedKeys(
    namespace: string,
    keys: string[],
  ): Promise<void> {
    if (keys.length === 0) return;

    const indexKey = this.buildIndexKey(namespace);

    for (let i = 0; i < keys.length; i += REMOVE_BATCH_SIZE) {
      const batch = keys.slice(i, i + REMOVE_BATCH_SIZE);
      const pipeline = this.redis.pipeline();

      // Delete the actual Redis value keys for this batch.
      pipeline.del(...batch.map((key) => this.buildCacheKey(namespace, key)));

      // Remove the same logical keys from the namespace index so future
      // invalidation calls do not process already-deleted values.
      pipeline.zrem(indexKey, ...batch);

      await this.execPipeline(pipeline);
    }
  }

  private async execPipeline(
    pipeline: ReturnType<RedisClient['pipeline']>,
  ): Promise<void> {
    const results = await pipeline.exec();

    // ioredis pipelines report per-command errors in the result array instead
    // of throwing for every command failure, so surface the first command error.
    const error = results?.find(([error]) => error)?.[0];

    if (error) throw error;
  }

  /**
   * Convert a Redis-style glob pattern to a JavaScript RegExp.
   * Supports: * (any chars), ? (single char), \* \? \[ \] (literals)
   */
  private globToRegex(pattern: string): RegExp {
    let regex = '^';
    let i = 0;

    while (i < pattern.length) {
      const char = pattern[i];

      if (char === '\\' && i + 1 < pattern.length) {
        // Preserve escaped glob characters as literals.
        const next = pattern[i + 1];
        regex += '\\' + next;
        i += 2;
      } else if (char === '*') {
        // Redis glob '*' maps to any number of characters.
        regex += '.*';
        i++;
      } else if (char === '?') {
        // Redis glob '?' maps to exactly one character.
        regex += '.';
        i++;
      } else if (/[.+^${}()|[\]\\]/.test(char)) {
        // Escape RegExp metacharacters that are not Redis glob operators.
        regex += '\\' + char;
        i++;
      } else {
        // Ordinary characters match themselves.
        regex += char;
        i++;
      }
    }

    regex += '$';
    return new RegExp(regex);
  }
}
