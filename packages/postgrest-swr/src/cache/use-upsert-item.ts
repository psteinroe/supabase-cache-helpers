import {
  upsertItem,
  UpsertItemProps,
} from "@supabase-cache-helpers/postgrest-mutate";
import { useSWRConfig } from "swr";

import { decode, usePostgrestFilterCache } from "../lib";
import { getMutableKeys } from "../lib/mutable-keys";

/**
 * Convenience hook to upsert an item into the swr cache. Does not make any http requests, and is supposed to be used for custom cache updates.
 * @param opts The mutation options
 * @returns void
 */
export function useUpsertItem<Type extends Record<string, unknown>>(
  opts: Omit<UpsertItemProps<Type>, "input">
) {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return async (input: Type) =>
    await upsertItem(
      {
        input,
        ...opts,
      },
      {
        cacheKeys: getMutableKeys(Array.from(cache.keys())),
        getPostgrestFilter,
        mutate,
        decode,
      }
    );
}
