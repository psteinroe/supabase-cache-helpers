import type { Entry } from './entry';
import type { Store } from './interface';

export type MemoryStoreConfig<TValue> = {
  persistentMap: Map<string, TValue>;
};

export class MemoryStore implements Store {
  private readonly state: Map<string, { expires: number; entry: Entry<any> }>;

  public readonly name = 'memory';

  constructor(
    config: MemoryStoreConfig<{ expires: number; entry: Entry<any> }>,
  ) {
    this.state = config.persistentMap;
  }

  public async get<Result>(key: string): Promise<Entry<Result> | undefined> {
    const value = this.state.get(key);
    if (!value) {
      return Promise.resolve(undefined);
    }
    if (value.expires <= Date.now()) {
      await this.remove(key);
    }
    return Promise.resolve(value.entry);
  }

  public async set<Result>(key: string, entry: Entry<Result>): Promise<void> {
    this.state.set(key, {
      expires: entry.staleUntil,
      entry,
    });

    return Promise.resolve();
  }

  public async remove(keys: string | string[]): Promise<void> {
    const cacheKeys = Array.isArray(keys) ? keys : [keys];

    for (const key of cacheKeys) {
      this.state.delete(key);
    }
    return Promise.resolve();
  }
}
