import { decode, usePostgrestFilterCache } from '../lib';
import { getMutableKeys } from '../lib/mutable-keys';
import {
  type MergeFn,
  type UpdateItemOperation,
  updateItem,
  updateItemInCacheData as baseUpdateItemInCacheData,
} from '@supabase-cache-helpers/postgrest-core';
import { flatten } from 'flat';
import { useSWRConfig } from 'swr';

/**
 * Updates item in SWR cache data structures.
 * Handles: SWR infinite (T[][]), delegates rest to shared base logic
 */
const updateItemInCacheData = <Type extends Record<string, unknown>>(
  data: unknown,
  input: Type,
  primaryKeys: (keyof Type)[],
  mergeFn?: MergeFn<Type>,
): unknown => {
  // Handle SWR infinite: T[][] (array of arrays)
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
    return data.map((page) =>
      baseUpdateItemInCacheData(page, input, primaryKeys, mergeFn),
    );
  }

  // Delegate to shared base logic (handles AnyPostgrestResponse, arrays, HasMore, single objects)
  return baseUpdateItemInCacheData(data, input, primaryKeys, mergeFn);
};

/**
 * Returns a function that updates an item in the cache without making HTTP requests.
 * This hook performs a cache-only partial merge update:
 * - Finds items across ALL cached queries matching the given primary keys
 * - Merges provided fields with existing item (customizable via `merge` option)
 * - Updates items in-place without changing their position in ordered queries
 * - Does nothing if item is not found (silent no-op)
 * - Never inserts new items, only updates existing ones
 *
 * @param opts - Options for the update operation, excluding the input record.
 * @returns A function that takes a partial record and returns a promise that resolves once cache is updated.
 *
 * @example
 * const updateContact = useUpdateItem({
 *   schema: 'public',
 *   table: 'contact',
 *   primaryKeys: ['id'],
 * });
 *
 * // Later, update a contact's name in cache
 * await updateContact({ id: '123', name: 'New Name' });
 *
 * @example
 * // With custom merge function
 * const updateContact = useUpdateItem({
 *   schema: 'public',
 *   table: 'contact',
 *   primaryKeys: ['id'],
 *   merge: (existing, input) => ({
 *     ...existing,
 *     ...input,
 *     updatedAt: new Date().toISOString(),
 *   }),
 * });
 */
export function useUpdateItem<Type extends Record<string, unknown>>(
  opts: Omit<UpdateItemOperation<Type>, 'input'>,
): (input: Type) => Promise<void> {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await updateItem<string, Type>(
      {
        input: flatten(input) as Type,
        ...opts,
      },
      {
        cacheKeys: getMutableKeys(Array.from(cache.keys())),
        getPostgrestFilter,
        decode,
        mutate: (key, transformedInput) =>
          mutate(
            key,
            (currentData: unknown) => {
              if (currentData === undefined) return currentData;
              return updateItemInCacheData(
                currentData,
                transformedInput,
                opts.primaryKeys,
                opts.merge,
              );
            },
            { revalidate: false },
          ),
      },
    );
}
