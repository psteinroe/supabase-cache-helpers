import { type AnyPostgrestResponse } from '@supabase-cache-helpers/postgrest-core';

export type Value<Result> = AnyPostgrestResponse<Result>;

export type Entry<Result> = {
  value: Value<Result>;

  // Before this time the entry is considered fresh and valid
  // UnixMilli
  freshUntil: number;

  /**
   * Unix timestamp in milliseconds.
   *
   * Do not use data after this point as it is considered no longer valid.
   *
   * You can use this field to configure automatic eviction in your store implementation.   *
   */
  staleUntil: number;
};
