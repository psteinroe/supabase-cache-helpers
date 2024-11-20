import { Context } from '../context';
import { Entry } from './entry';
import { StoreAdapter } from './interface';
import { Store } from './store';

/**
 * TieredCache is a cache that will first check the memory cache, then the zone cache.
 */
export class TieredStore implements Store {
  private ctx: Context;
  private readonly tiers: StoreAdapter[];
  readonly namespace: string;
  public readonly name = 'tiered';

  /**
   * Create a new tiered store
   * Stored are checked in the order they are provided
   * The first store to return a value will be used to populate all previous stores
   *
   *
   * `stores` can accept `undefined` as members to allow you to construct the tiers dynamically
   * @example
   * ```ts
   * new TieredStore(ctx, [
   *   new MemoryStore(..),
   *   process.env.ENABLE_X_STORE ? new XStore(..) : undefined
   * ])
   * ```
   */
  constructor(
    ctx: Context,
    stores: (StoreAdapter | undefined)[],
    namespace: string,
  ) {
    this.ctx = ctx;
    this.tiers = stores.filter(Boolean) as StoreAdapter[];
    this.namespace = namespace;
  }

  /**
   * Return the cached value
   *
   * The response will be `undefined` for cache misses or `null` when the key was not found in the origin
   */
  public async get<Result>(key: string): Promise<Entry<Result> | undefined> {
    if (this.tiers.length === 0) {
      return;
    }

    for (let i = 0; i < this.tiers.length; i++) {
      const res = await this.tiers[i].get<Result>(this.namespace, key);
      if (typeof res !== 'undefined') {
        // Fill all lower caches
        this.ctx.waitUntil(
          Promise.all(
            this.tiers
              .filter((_, j) => j < i)
              .map((t) => () => t.set(this.namespace, key, res)),
          ),
        );

        return res;
      }
    }
  }

  /**
   * Sets the value for the given key.
   */
  public async set<Result>(key: string, value: Entry<Result>): Promise<void> {
    await Promise.all(this.tiers.map((t) => t.set(this.namespace, key, value)));
  }

  /**
   * Removes the key from the cache.
   */
  public async remove(key: string): Promise<void> {
    await Promise.all(this.tiers.map((t) => t.remove(this.namespace, key)));
  }
}