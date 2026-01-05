import { decode, usePostgrestFilterCache } from '../lib';
import { extractCacheDataArray } from '../lib/extract-cache-data-array';
import {
  type RevalidateForUpsertOperation,
  revalidateForUpsert,
} from '@supabase-cache-helpers/postgrest-core';
import { useQueryClient } from '@tanstack/react-query';
import { flatten } from 'flat';

/**
 * Returns a function that triggers revalidation of cached queries affected by an upsert.
 * This hook does not make any HTTP requests directly - it triggers React Query revalidation.
 *
 * Revalidates queries where:
 * 1. The item SHOULD be in the query (matches filters), OR
 * 2. The item WAS in the query (found by PK in cache, may need removal after update)
 *
 * @param opts - Options for the revalidation, excluding the input record.
 * @returns A function that takes a record of type `Type` and returns a promise that resolves once revalidation is triggered.
 */
export function useRevalidateForUpsert<Type extends Record<string, unknown>>(
  opts: Omit<RevalidateForUpsertOperation<Type>, 'input'>,
) {
  const queryClient = useQueryClient();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await revalidateForUpsert(
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
