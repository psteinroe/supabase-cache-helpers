import type { Entry } from './entry';
import type { Store } from './interface';

export type MemoryStoreConfig<TValue> = {
  persistentMap: Map<string, TValue>;
  // The maximum number of entries in the cache. If not set, the cache will grow indefinitely.
  capacity?: number;
};

export class MemoryStore implements Store {
  private readonly state: Map<string, { expires: number; entry: Entry<any> }>;
  private readonly capacity?: number;

  public readonly name = 'memory';

  constructor(
    config: MemoryStoreConfig<{ expires: number; entry: Entry<any> }>,
  ) {
    this.state = config.persistentMap;
    this.capacity = config.capacity;
  }

  private buildCacheKey(namespace: string, key: string): string {
    return [namespace, key].join('::');
  }

  private setMostRecentlyUsed(
    key: string,
    value: { expires: number; entry: Entry<any> },
  ) {
    this.state.delete(key);
    this.state.set(key, value);
  }

  public async get<Result>(
    namespace: string,
    key: string,
  ): Promise<Entry<Result> | undefined> {
    const cacheKey = this.buildCacheKey(namespace, key);
    const value = this.state.get(cacheKey);
    if (!value) {
      return Promise.resolve(undefined);
    }
    if (value.expires <= Date.now()) {
      await this.remove(namespace, key);
    }

    if (this.capacity) {
      this.setMostRecentlyUsed(cacheKey, value);
    }

    return Promise.resolve(value.entry);
  }

  public async set<Result>(
    namespace: string,
    key: string,
    entry: Entry<Result>,
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(namespace, key);

    if (this.capacity) {
      this.setMostRecentlyUsed(cacheKey, {
        expires: entry.staleUntil,
        entry,
      });
    } else {
      this.state.set(cacheKey, {
        expires: entry.staleUntil,
        entry,
      });
    }

    if (this.capacity && this.state.size > this.capacity) {
      const oldestKey = this.state.keys().next().value;
      if (oldestKey !== undefined) {
        this.state.delete(oldestKey);
      }
    }

    return Promise.resolve();
  }

  public async remove(
    namespace: string,
    keys: string | string[],
  ): Promise<void> {
    const cacheKeys = Array.isArray(keys) ? keys : [keys];

    for (const key of cacheKeys) {
      this.state.delete(this.buildCacheKey(namespace, key));
    }
    return Promise.resolve();
  }

  public async removeByPrefix(
    namespace: string,
    prefix: string,
  ): Promise<void> {
    const cacheKeyPrefix = this.buildCacheKey(namespace, prefix);

    for (const key of this.state.keys()) {
      if (key.startsWith(cacheKeyPrefix)) {
        this.state.delete(key);
      }
    }
  }

  public async removeByPattern(
    namespace: string,
    pattern: string,
  ): Promise<void> {
    const regex = this.globToRegex(this.buildCacheKey(namespace, pattern));

    for (const key of this.state.keys()) {
      if (regex.test(key)) {
        this.state.delete(key);
      }
    }
  }

  /**
   * Convert a glob pattern to a regex, handling escaped characters.
   * Supports: * (any chars), ? (single char), \* \? \[ \] (literals)
   */
  private globToRegex(pattern: string): RegExp {
    let regex = '^';
    let i = 0;

    while (i < pattern.length) {
      const char = pattern[i];

      if (char === '\\' && i + 1 < pattern.length) {
        // Escaped character - match literally
        const next = pattern[i + 1];
        regex += '\\' + next;
        i += 2;
      } else if (char === '*') {
        // Wildcard - match any characters
        regex += '.*';
        i++;
      } else if (char === '?') {
        // Single char wildcard
        regex += '.';
        i++;
      } else if (/[.+^${}()|[\]\\]/.test(char)) {
        // Escape regex special chars
        regex += '\\' + char;
        i++;
      } else {
        regex += char;
        i++;
      }
    }

    regex += '$';
    return new RegExp(regex);
  }
}
