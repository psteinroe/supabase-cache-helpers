import { type AnyPostgrestResponse } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/postgrest-js';

import { Context } from './context';
import { encode } from './key';
import { Value } from './stores/entry';
import { Store } from './stores/interface';
import { SwrCache } from './swr-cache';
import { TieredStore } from './tiered-store';

export type QueryCacheOpts = {
  stores: Store[];
  fresh: number;
  stale: number;
};

export type OperationOpts = Pick<QueryCacheOpts, 'fresh' | 'stale'>;

export class QueryCache {
  private readonly inner: SwrCache;

  /**
   * To prevent concurrent requests of the same data, all queries are deduplicated using
   * this map.
   */
  private readonly runningQueries: Map<
    string,
    PromiseLike<AnyPostgrestResponse<any>>
  > = new Map();

  constructor(ctx: Context, opts: QueryCacheOpts) {
    const tieredStore = new TieredStore(ctx, opts.stores);

    this.inner = new SwrCache({
      ctx,
      store: tieredStore,
      fresh: opts.fresh,
      stale: opts.stale,
    });
  }

  /**
   * Perform a cached postgrest query
   */
  query<Result>(
    query: PromiseLike<PostgrestSingleResponse<Result>>,
    opts?: Partial<OperationOpts> & {
      store?: (result: PostgrestSingleResponse<Result>) => boolean;
    },
  ): Promise<PostgrestSingleResponse<Result>>;
  /**
   * Perform a cached postgrest query
   */
  query<Result>(
    query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
    opts?: Partial<OperationOpts> & {
      store?: (result: PostgrestMaybeSingleResponse<Result>) => boolean;
    },
  ): Promise<PostgrestMaybeSingleResponse<Result>>;
  /**
   * Perform a cached postgrest query
   */
  query<Result>(
    query: PromiseLike<PostgrestResponse<Result>>,
    opts?: Partial<OperationOpts> & {
      store?: (result: PostgrestResponse<Result>) => boolean;
    },
  ): Promise<PostgrestResponse<Result>>;
  async query<Result>(
    query: PromiseLike<AnyPostgrestResponse<Result>>,
    opts?: Partial<OperationOpts> & {
      store?: (result: AnyPostgrestResponse<Result>) => boolean;
    },
  ): Promise<AnyPostgrestResponse<Result>> {
    const key = encode(query);

    const value = await this.inner.get<Result>(key);

    if (value) return value;

    const result = await this.dedupeQuery(query);

    if (!opts?.store || opts.store(result)) {
      await this.inner.set(key, result, opts);
    }

    return result;
  }

  /**
   * Perform a cached postgrest query
   */
  swr<Result>(
    query: PromiseLike<PostgrestSingleResponse<Result>>,
    opts?: OperationOpts,
  ): Promise<PostgrestSingleResponse<Result>>;
  /**
   * Perform a cached postgrest query
   */
  swr<Result>(
    query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
    opts?: OperationOpts,
  ): Promise<PostgrestMaybeSingleResponse<Result>>;
  /**
   * Perform a cached postgrest query
   */
  swr<Result>(
    query: PromiseLike<PostgrestResponse<Result>>,
    opts?: OperationOpts,
  ): Promise<PostgrestResponse<Result>>;
  async swr<Result>(
    query: PromiseLike<AnyPostgrestResponse<Result>>,
    opts?: OperationOpts,
  ): Promise<AnyPostgrestResponse<Result>> {
    return await this.inner.swr(
      encode(query),
      () => this.dedupeQuery(query),
      opts,
    );
  }

  /**
   * Deduplicating the origin load helps when the same value is requested many times at once and is
   * not yet in the cache. If we don't deduplicate, we'd create a lot of unnecessary load on the db.
   */
  private async dedupeQuery<Result>(
    query: PromiseLike<AnyPostgrestResponse<Result>>,
  ): Promise<Value<Result>> {
    const key = encode(query);
    try {
      const querying = this.runningQueries.get(key);
      if (querying) {
        return querying;
      }

      this.runningQueries.set(key, query);
      return await query;
    } finally {
      this.runningQueries.delete(key);
    }
  }
}
