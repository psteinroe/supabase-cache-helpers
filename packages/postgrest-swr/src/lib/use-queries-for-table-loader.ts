import { LoadQueryOps } from "@supabase-cache-helpers/postgrest-fetcher";
import { useSWRConfig } from "swr";

import { decode } from "./decode";
import { usePostgrestFilterCache } from "./use-postgrest-filter-cache";

export const useQueriesForTableLoader = (table: string) => {
  const { cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return () =>
    Array.from(cache.keys()).reduce<
      ReturnType<LoadQueryOps["queriesForTable"]>
    >((prev, curr) => {
      const decodedKey = decode(curr);
      if (decodedKey?.table === table) {
        prev.push(getPostgrestFilter(decodedKey.queryKey).params);
      }
      return prev;
    }, []);
};
