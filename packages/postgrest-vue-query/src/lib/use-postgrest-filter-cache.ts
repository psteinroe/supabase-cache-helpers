import {
  encodeObject,
  PostgrestFilter,
  PostgrestQueryParserOptions,
} from '@supabase-cache-helpers/postgrest-core';
import { useQueryClient } from '@tanstack/vue-query';

export const POSTGREST_FILTER_KEY_PREFIX = 'postgrest-filter';

export const usePostgrestFilterCache = <
  R extends Record<string, unknown>,
>() => {
  const queryClient = useQueryClient();

  return (query: string, opts?: PostgrestQueryParserOptions) => {
    const key = [
      POSTGREST_FILTER_KEY_PREFIX,
      query,
      opts ? encodeObject(opts) : null,
    ];
    const cacheData = queryClient.getQueryData(key);
    if (cacheData instanceof PostgrestFilter) {
      return cacheData;
    }
    const filter = PostgrestFilter.fromQuery(query, opts);
    queryClient.setQueryData(key, filter);
    return filter as PostgrestFilter<R>;
  };
};
