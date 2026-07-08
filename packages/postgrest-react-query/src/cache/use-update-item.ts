import { decode, usePostgrestFilterCache } from '../lib';
import {
  type MergeFn,
  type UpdateItemOperation,
  updateItem,
  updateItemInCacheData as baseUpdateItemInCacheData,
} from '@supabase-cache-helpers/postgrest-core';
import { useQueryClient } from '@tanstack/react-query';
import { flatten } from 'flat';

/**
 * Updates item in React Query cache data structures.
 * Handles: RQ infinite ({ pages, pageParams }), delegates rest to shared base logic
 */
const updateItemInCacheData = <Type extends Record<string, unknown>>(
  data: unknown,
  input: Type,
  primaryKeys: (keyof Type)[],
  mergeFn?: MergeFn<Type>,
): unknown => {
  // Handle React Query infinite: { pages, pageParams }
  if (
    data !== null &&
    typeof data === 'object' &&
    'pages' in data &&
    Array.isArray((data as { pages: unknown[] }).pages)
  ) {
    const infiniteData = data as { pages: unknown[]; pageParams: unknown[] };
    return {
      ...infiniteData,
      pages: infiniteData.pages.map((page) =>
        updateItemInCacheData(page, input, primaryKeys, mergeFn),
      ),
    };
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
  const queryClient = useQueryClient();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await updateItem(
      {
        input: flatten(input) as Type,
        ...opts,
      },
      {
        cacheKeys: queryClient
          .getQueryCache()
          .getAll()
          .map((c) => c.queryKey),
        getPostgrestFilter,
        decode,
        mutate: (key, transformedInput) =>
          queryClient.setQueryData(key, (currentData: unknown) => {
            if (currentData === undefined) return currentData;
            return updateItemInCacheData(
              currentData,
              transformedInput,
              opts.primaryKeys,
              opts.merge,
            );
          }),
      },
    );
}
