import {
  upsertItem,
  UpsertItemOperation,
} from '@supabase-cache-helpers/postgrest-core';
import { useQueryClient } from '@tanstack/react-query';

import { decode, usePostgrestFilterCache } from '../lib';

/**
 * Convenience hook to upsert an item into the react query cache. Does not make any http requests, and is supposed to be used for custom cache updates.
 * @param opts The mutation options
 * @returns void
 */
export function useUpsertItem<Type extends Record<string, unknown>>(
  opts: Omit<UpsertItemOperation<Type>, 'input'>,
) {
  const queryClient = useQueryClient();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await upsertItem(
      {
        input,
        ...opts,
      },
      {
        cacheKeys: queryClient
          .getQueryCache()
          .getAll()
          .map((c) => c.queryKey),
        getPostgrestFilter,
        revalidate: (key) => queryClient.invalidateQueries({ queryKey: key }),
        mutate: (key, fn) => {
          queryClient.setQueriesData({ queryKey: key }, fn);
        },
        decode,
      },
    );
}
