import {
  deleteItem,
  DeleteItemProps,
} from '@supabase-cache-helpers/postgrest-mutate';
import { useQueryClient } from '@tanstack/react-query';

import { decode, usePostgrestFilterCache } from '../lib';

/**
 * Convenience hook to delete an item from the react query cache. Does not make any http requests, and is supposed to be used for custom cache updates.
 * @param opts The mutation options
 * @returns void
 */
export function useDeleteItem<Type extends Record<string, unknown>>(
  opts: Omit<DeleteItemProps<Type>, 'input'>
) {
  const queryClient = useQueryClient();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await deleteItem(
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
        mutate: (key, fn) => {
          queryClient.setQueriesData(key, fn);
        },
        decode,
      }
    );
}
