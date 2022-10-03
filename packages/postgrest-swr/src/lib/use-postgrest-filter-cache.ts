import { useSWRConfig } from "swr";
import {
  encodeObject,
  PostgrestFilter,
  PostgrestQueryParserOptions,
} from "@supabase-cache-helpers/postgrest-filter";
import { POSTGREST_FILTER_KEY_PREFIX, KEY_SEPARATOR } from "./constants";

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
    const cachedFilter = cache.get(key);
    if (cachedFilter && cachedFilter instanceof PostgrestFilter)
      return cachedFilter;
    const filter = PostgrestFilter.fromQuery(query, opts);
    cache.set(key, filter);
    return filter as PostgrestFilter<R>;
  };
};
