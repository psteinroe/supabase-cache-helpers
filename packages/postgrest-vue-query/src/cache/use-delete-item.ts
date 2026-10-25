import { getRevalidationOptions, useMutationCache } from './use-mutation-cache';
import {
  type DeleteItemOperation,
  deleteItem,
} from '@supabase-cache-helpers/postgrest-core';
import { flatten } from 'flat';

/**
 * Convenience hook to delete an item from the Vue Query cache. Does not make any http requests, and is supposed to be used for custom cache updates.
 * @param opts The mutation options
 * @returns void
 */
export function useDeleteItem<Type extends Record<string, unknown>>(
  opts: Omit<DeleteItemOperation<Type>, 'input'>,
) {
  const cache = useMutationCache<Type>();

  return async (input: Type) =>
    await deleteItem(
      {
        input: flatten(input) as Type,
        ...opts,
        ...getRevalidationOptions(opts),
      },
      cache(),
    );
}
