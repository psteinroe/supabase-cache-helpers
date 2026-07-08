import { decode, usePostgrestFilterCache } from '../lib';
import { extractCacheDataArray } from '../lib/extract-cache-data-array';
import { getMutableKeys } from '../lib/mutable-keys';
import {
  type RevalidateForDeleteOperation,
  revalidateForDelete,
} from '@supabase-cache-helpers/postgrest-core';
import { flatten } from 'flat';
import { useSWRConfig } from 'swr';

/**
 * Returns a function that triggers revalidation of cached queries containing a deleted item.
 * This hook does not make any HTTP requests directly - it triggers SWR revalidation.
 *
 * Revalidates queries that currently contain the item (found by primary key in cache).
 *
 * @param opts - Options for the revalidation, excluding the input record.
 *
 * @returns A function that takes a record of type `Type` and returns a promise that resolves once revalidation is triggered.
 * **/
export function useRevalidateForDelete<Type extends Record<string, unknown>>(
  opts: Omit<RevalidateForDeleteOperation<Type>, 'input'>,
): (input: Type) => Promise<void> {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await revalidateForDelete<string, Type>(
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
