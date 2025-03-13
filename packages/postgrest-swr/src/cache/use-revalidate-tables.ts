import {
  type RevalidateTablesOperation,
  revalidateTables,
} from '@supabase-cache-helpers/postgrest-core';
import { useSWRConfig } from 'swr';

import { decode } from '../lib';
import { getMutableKeys } from '../lib/mutable-keys';

/**
 * Returns a function that can be used to revalidate all queries in the cache that match the tables provided in the `RevalidateTablesOperation`
 * This hook does not make any HTTP requests and is intended to be used for custom cache revalidations.
 *
 * @param tables - The tables to revalidate
 *
 * @returns A function that will revalidate all defined tables when called.
 * **/
export function useRevalidateTables(
  tables: RevalidateTablesOperation,
): () => Promise<void> {
  const { mutate, cache } = useSWRConfig();

  return async () =>
    await revalidateTables<string>(tables, {
      cacheKeys: getMutableKeys(Array.from(cache.keys())),
      revalidate: (key) => {
        mutate(key);
      },
      decode,
    });
}
