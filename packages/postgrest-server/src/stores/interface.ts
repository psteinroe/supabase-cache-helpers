import { Entry } from './entry';

/**
 * A store is a common interface for storing, reading and deleting key-value pairs.
 *
 * The store implementation is responsible for cleaning up expired data on its own.
 */
export interface Store {
  /**
   * A name for metrics/tracing.
   *
   * @example: memory | zone
   */
  name: string;

  /**
   * Return the cached value
   *
   * The response must be `undefined` for cache misses
   */
  get<Result>(key: string): Promise<Entry<Result> | undefined>;

  /**
   * Sets the value for the given key.
   *
   * You are responsible for evicting expired values in your store implementation.
   * Use the `entry.staleUntil` (unix milli timestamp) field to configure expiration
   */
  set<Result>(key: string, value: Entry<Result>): Promise<void>;

  /**
   * Removes the key from the store.
   */
  remove(key: string | string[]): Promise<void>;
}
