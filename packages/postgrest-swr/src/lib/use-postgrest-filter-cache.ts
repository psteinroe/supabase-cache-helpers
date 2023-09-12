import {
  encodeObject,
  PostgrestFilter,
  PostgrestQueryParserOptions,
} from '@supabase-cache-helpers/postgrest-core';
import { useSWRConfig } from 'swr';

import { POSTGREST_FILTER_KEY_PREFIX, KEY_SEPARATOR } from './constants';

export const usePostgrestFilterCache = <
  R extends Record<string, unknown>
>() => {
  const { cache } = useSWRConfig();

  return (query: string, opts?: PostgrestQueryParserOptions) => {
    const key = [
      POSTGREST_FILTER_KEY_PREFIX,
      query,
      opts ? encodeObject(opts) : null,
    ]
      .filter(Boolean)
      .join(KEY_SEPARATOR);
    const cacheData = cache.get(key);
    if (cacheData && cacheData.data instanceof PostgrestFilter) {
      return cacheData.data;
    }
    const filter = PostgrestFilter.fromQuery(query, opts);
    cache.set(key, { data: filter });
    return filter as PostgrestFilter<R>;
  };
};
