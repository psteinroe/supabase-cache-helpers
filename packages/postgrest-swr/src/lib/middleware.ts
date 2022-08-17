import { BareFetcher, Key, Middleware, SWRConfiguration, SWRHook } from "swr";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { PostgrestParser } from "@supabase-cache-helpers/postgrest-filter";
import {
  SWRInfiniteConfiguration,
  SWRInfiniteFetcher,
  SWRInfiniteHook,
  SWRInfiniteKeyLoader,
} from "swr/infinite";
import { encode } from "./coder";

export const middleware: Middleware = <Type>(useSWRNext: SWRHook) => {
  return (
    key: Key,
    fetcher: BareFetcher<Type> | null,
    config: SWRConfiguration
  ) => {
    const query = key as PostgrestFilterBuilder<Type>;
    if (!fetcher) throw new Error("No fetcher provided");
    return useSWRNext(
      encode(new PostgrestParser<Type>(query)),
      () => fetcher(query),
      config
    );
  };
};

export const infiniteMiddleware = <Type extends object>(
  useSWRInfiniteNext: SWRInfiniteHook
) => {
  return (
    keyFn: SWRInfiniteKeyLoader,
    fetcher: SWRInfiniteFetcher,
    config: SWRInfiniteConfiguration
  ) => {
    return useSWRInfiniteNext(
      (index, previousPageData) => {
        const query = keyFn(index, previousPageData);
        if (!query) return null;
        return encode(
          new PostgrestParser<Type>(query as PostgrestFilterBuilder<Type>)
        );
      },
      typeof fetcher === "function" ? (query) => fetcher(query) : fetcher,
      config
    );
  };
};
