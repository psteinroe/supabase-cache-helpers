import type { BuildNormalizedQueryOps } from '@supabase-cache-helpers/postgrest-core';
import { useSWRConfig } from 'swr';

import { decode } from './decode';
import { usePostgrestFilterCache } from './use-postgrest-filter-cache';

export const useQueriesForTableLoader = (table: string) => {
  const { cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return () =>
    Array.from(cache.keys()).reduce<
      ReturnType<BuildNormalizedQueryOps['queriesForTable']>
    >((prev, curr) => {
      const decodedKey = decode(curr);
      if (decodedKey?.table === table) {
        prev.push(getPostgrestFilter(decodedKey.queryKey).params);
      }
      return prev;
    }, []);
};
