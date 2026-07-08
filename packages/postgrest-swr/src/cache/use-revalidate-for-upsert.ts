import { decode, usePostgrestFilterCache } from '../lib';
import { extractCacheDataArray } from '../lib/extract-cache-data-array';
import { getMutableKeys } from '../lib/mutable-keys';
import {
  type RevalidateForUpsertOperation,
  revalidateForUpsert,
} from '@supabase-cache-helpers/postgrest-core';
import { flatten } from 'flat';
import { useSWRConfig } from 'swr';

/**
 * Returns a function that triggers revalidation of cached queries affected by an upsert.
 * This hook does not make any HTTP requests directly - it triggers SWR revalidation.
 *
 * Revalidates queries where:
 * 1. The item SHOULD be in the query (matches filters), OR
 * 2. The item WAS in the query (found by PK in cache, may need removal after update)
 *
 * @param opts - Options for the revalidation, excluding the input record.
 *
 * @returns A function that takes a record of type `Type` and returns a promise that resolves once revalidation is triggered.
 * **/
export function useRevalidateForUpsert<Type extends Record<string, unknown>>(
  opts: Omit<RevalidateForUpsertOperation<Type>, 'input'>,
): (input: Type) => Promise<void> {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await revalidateForUpsert<string, Type>(
      {
        input: flatten(input) as Type,
        ...opts,
      },
      {
        cacheKeys: getMutableKeys(Array.from(cache.keys())),
        getPostgrestFilter,
        revalidate: (key) => mutate(key),
        decode,
        getData: (key) => {
          const cacheData = cache.get(key);
          return extractCacheDataArray<Type>(cacheData?.data);
        },
      },
    );
}
