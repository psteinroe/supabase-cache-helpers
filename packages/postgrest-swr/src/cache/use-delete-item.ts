import { decode, usePostgrestFilterCache } from '../lib';
import { getMutableKeys } from '../lib/mutable-keys';
import {
  type DeleteItemOperation,
  deleteItem,
} from '@supabase-cache-helpers/postgrest-core';
import { flatten } from 'flat';
import { type MutatorOptions, useSWRConfig } from 'swr';

/**
 * Returns a function that can be used to delete an item into the SWR cache.
 * This hook does not make any HTTP requests and is intended to be used for custom cache updates.
 *
 * @param opts - Options for the delete operation, excluding the input record.
 *
 * @returns A function that takes a record of type `Type` and returns a promise that resolves once the record has been deleted from the cache.
 * **/
export function useDeleteItem<Type extends Record<string, unknown>>(
  opts: Omit<DeleteItemOperation<Type>, 'input'> & MutatorOptions<Type>,
): (input: Type) => Promise<void> {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await deleteItem<string, Type>(
      {
        input: flatten(input) as Type,
        ...opts,
      },
      {
        cacheKeys: getMutableKeys(Array.from(cache.keys())),
        getPostgrestFilter,
        revalidate: (key) => {
          mutate(key);
        },
        mutate: (key, data) => {
          mutate(key, data, { ...opts, revalidate: opts?.revalidate ?? false });
        },
        decode,
      },
    );
}
