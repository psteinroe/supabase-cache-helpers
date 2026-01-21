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

  private setMostRecentlyUsed(
    key: string,
    value: { expires: number; entry: Entry<any> },
  ) {
    this.state.delete(key);
    this.state.set(key, value);
  }

  public async get<Result>(key: string): Promise<Entry<Result> | undefined> {
    const value = this.state.get(key);
    if (!value) {
      return Promise.resolve(undefined);
    }
    if (value.expires <= Date.now()) {
      await this.remove(key);
    }

    if (this.capacity) {
      this.setMostRecentlyUsed(key, value);
    }

    return Promise.resolve(value.entry);
  }

  public async set<Result>(key: string, entry: Entry<Result>): Promise<void> {
    if (this.capacity) {
      this.setMostRecentlyUsed(key, {
        expires: entry.staleUntil,
        entry,
      });
    } else {
      this.state.set(key, {
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

  public async remove(keys: string | string[]): Promise<void> {
    const cacheKeys = Array.isArray(keys) ? keys : [keys];

    for (const key of cacheKeys) {
      this.state.delete(key);
    }
    return Promise.resolve();
  }

  public async removeByPrefix(prefix: string): Promise<void> {
    for (const key of this.state.keys()) {
      if (key.startsWith(prefix)) {
        this.state.delete(key);
      }
    }
  }

  public async removeByPattern(pattern: string): Promise<void> {
    const regex = this.globToRegex(pattern);

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
