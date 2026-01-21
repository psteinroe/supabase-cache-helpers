import { decode, usePostgrestFilterCache } from '../lib';
import { extractCacheDataArray } from '../lib/extract-cache-data-array';
import {
  type RevalidateForDeleteOperation,
  revalidateForDelete,
} from '@supabase-cache-helpers/postgrest-core';
import { useQueryClient } from '@tanstack/react-query';
import { flatten } from 'flat';

/**
 * Returns a function that triggers revalidation of cached queries containing a deleted item.
 * This hook does not make any HTTP requests directly - it triggers React Query revalidation.
 *
 * Revalidates queries that currently contain the item (found by primary key in cache).
 *
 * @param opts - Options for the revalidation, excluding the input record.
 * @returns A function that takes a record of type `Type` and returns a promise that resolves once revalidation is triggered.
 */
export function useRevalidateForDelete<Type extends Record<string, unknown>>(
  opts: Omit<RevalidateForDeleteOperation<Type>, 'input'>,
) {
  const queryClient = useQueryClient();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await revalidateForDelete(
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
        revalidate: (key) => queryClient.invalidateQueries({ queryKey: key }),
        decode,
        getData: (key) => {
          const cacheData = queryClient.getQueryData(key);
          return extractCacheDataArray<Type>(cacheData);
        },
      },
    );
}
