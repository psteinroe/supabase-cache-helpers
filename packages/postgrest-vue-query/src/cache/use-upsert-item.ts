import { getRevalidationOptions, useMutationCache } from './use-mutation-cache';
import {
  type UpsertItemOperation,
  upsertItem,
} from '@supabase-cache-helpers/postgrest-core';
import { flatten } from 'flat';

/**
 * Convenience hook to upsert an item into the Vue Query cache. Does not make any http requests, and is supposed to be used for custom cache updates.
 * @param opts The mutation options
 * @returns void
 */
export function useUpsertItem<Type extends Record<string, unknown>>(
  opts: Omit<UpsertItemOperation<Type>, 'input'>,
) {
  const cache = useMutationCache<Type>();

  return async (input: Type) =>
    await upsertItem(
      {
        input: flatten(input) as Type,
        ...opts,
        ...getRevalidationOptions(opts),
      },
      cache(),
    );
}
