import { decode } from '../lib';
import {
  type RevalidateTablesOperation,
  revalidateTables,
} from '@supabase-cache-helpers/postgrest-core';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Returns a function that can be used to revalidate all queries in the cache that match the tables provided in the `RevalidateTablesOperation`
 * This hook does not make any HTTP requests and is intended to be used for custom cache revalidations.
 *
 * @param opts - The tables to revalidate
 *
 * @returns A function that will revalidate all defined tables when called.
 * **/
export function useRevalidateTables(
  tables: RevalidateTablesOperation,
): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () =>
    await revalidateTables(tables, {
      cacheKeys: queryClient
        .getQueryCache()
        .getAll()
        .map((c) => c.queryKey),
      revalidate: (key) => queryClient.invalidateQueries({ queryKey: key }),
      decode,
    });
}
