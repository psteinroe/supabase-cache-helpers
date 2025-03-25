import { PostgrestResponse } from '@supabase/postgrest-js';
import type { Context } from './context';
import { Value } from './stores/entry';
import { Store } from './stores/interface';

export type SwrCacheOpts = {
  ctx: Context;
  store: Store;
  fresh: number;
  stale: number;
};

/**
 * Internal cache implementation for an individual namespace
 */
export class SwrCache {
  private readonly ctx: Context;
  private readonly store: Store;
  private readonly fresh: number;
  private readonly stale: number;

  constructor({ ctx, store, fresh, stale }: SwrCacheOpts) {
    this.ctx = ctx;
    this.store = store;
    this.fresh = fresh;
    this.stale = stale;
  }

  /**
   * Return the cached value
   *
   * The response will be `undefined` for cache misses or `null` when the key was not found in the origin
   */
  public async get<Result>(key: string): Promise<Value<Result> | undefined> {
    const res = await this._get<Result>(key);
    return res.value;
  }

  private async _get<Result>(
    key: string,
  ): Promise<{ value: Value<Result> | undefined; revalidate?: boolean }> {
    const res = await this.store.get<Result>(key);

    const now = Date.now();
    if (!res) {
      return { value: undefined };
    }

    if (now >= res.staleUntil) {
      this.ctx.waitUntil(this.remove(key));
      return { value: undefined };
    }
    if (now >= res.freshUntil) {
      return { value: res.value, revalidate: true };
    }

    return { value: res.value };
  }

  /**
   * Set the value
   */
  public async set<Result>(
    key: string,
    value: Value<Result>,
    opts?: {
      fresh?: number;
      stale?: number;
    },
  ): Promise<void> {
    const now = Date.now();
    return this.store.set(key, {
      value,
      freshUntil: now + (opts?.fresh ?? this.fresh),
      staleUntil: now + (opts?.stale ?? this.stale),
    });
  }

  /**
   * Removes the key from the cache.
   */
  public async remove(key: string): Promise<void> {
    return this.store.remove(key);
  }

  public async swr<Result>(
    key: string,
    loadFromOrigin: (key: string) => Promise<Value<Result>>,
    opts?: {
      fresh: number;
      stale: number;
    },
  ): Promise<Value<Result>> {
    const res = await this._get<Result>(key);

    const { value, revalidate } = res;

    if (typeof value !== 'undefined') {
      if (revalidate) {
        this.ctx.waitUntil(
          loadFromOrigin(key).then((res) => {
            if (res.data || typeof res.count === 'number') {
              this.set(key, res, opts);
            }
          }),
        );
      }

      return value;
    }

    const loadedValue = await loadFromOrigin(key);
    if (loadedValue.data || typeof loadedValue.count === 'number') {
      this.ctx.waitUntil(this.set(key, loadedValue));
    }
    return loadedValue;
  }
}
