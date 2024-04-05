import {
  mutateItem,
  MutateItemOperation,
} from '@supabase-cache-helpers/postgrest-core';
import { useQueryClient } from '@tanstack/vue-query';
import flatten from 'flat';

import { decode, usePostgrestFilterCache } from '../lib';

/**
 * Convenience hook to mutate an item within the vue query cache. Does not make any http requests, and is supposed to be used for custom cache updates.
 * @param opts The mutation options
 * @returns void
 */
export function useMutateItem<Type extends Record<string, unknown>>(
  opts: Omit<MutateItemOperation<Type>, 'input' | 'mutate'>,
): (input: Partial<Type>, mutateFn: (current: Type) => Type) => Promise<void> {
  const queryClient = useQueryClient();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Partial<Type>, mutateFn: (current: Type) => Type) =>
    await mutateItem(
      {
        input: flatten(input) as Partial<Type>,
        mutate: mutateFn,
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
