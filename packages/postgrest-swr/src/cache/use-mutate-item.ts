import {
  mutateItem,
  MutateItemOperation,
} from '@supabase-cache-helpers/postgrest-core';
import { MutatorOptions, useSWRConfig } from 'swr';

import { decode, usePostgrestFilterCache } from '../lib';
import { getMutableKeys } from '../lib/mutable-keys';

/**
 * Returns a function that can be used to mutate an item by primary key(s) in the SWR cache.
 * This hook does not make any HTTP requests and is intended to be used for custom cache updates.
 *
 * @param opts - Options for the mutate operation, excluding the input and the mutate function.
 *
 * @returns A function that takes a record that should contain a value for all primary keys of `Type` as well as a mutate function  and returns a promise that resolves once the record has been upserted into the cache.
 * **/
export function useMutateItem<Type extends Record<string, unknown>>(
  opts: Omit<MutateItemOperation<Type>, 'input' | 'mutate'> &
    MutatorOptions<Type>,
): (input: Partial<Type>, mutateFn: (current: Type) => Type) => Promise<void> {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Partial<Type>, mutateFn: (current: Type) => Type) =>
    await mutateItem<string, Type>(
      {
        input,
        mutate: mutateFn,
        ...opts,
      },
      {
        cacheKeys: getMutableKeys(Array.from(cache.keys())),
        getPostgrestFilter,
        revalidate: (key) => {
          mutate(key, { ...opts, revalidate: true });
        },
        mutate: (key, data) => {
          mutate(key, data, {
            ...opts,
            revalidate: opts?.revalidate ?? false,
          });
        },
        decode,
      },
    );
}
