import { PostgrestParser } from "@supabase-cache-helpers/postgrest-filter";
import { PostgrestBuilder } from "@supabase/postgrest-js";
import { BareFetcher, Key, Middleware, SWRConfiguration, SWRHook } from "swr";
import {
  SWRInfiniteConfiguration,
  SWRInfiniteFetcher,
  SWRInfiniteHook,
  SWRInfiniteKeyLoader,
} from "swr/infinite";

import { encode } from "./encode";

export const middleware: Middleware = <Result>(useSWRNext: SWRHook) => {
  return (
    key: Key,
    fetcher: BareFetcher<Result> | null,
    config: SWRConfiguration
  ) => {
    const query = key as PostgrestBuilder<Result>;
    if (!fetcher) throw new Error("No fetcher provided");
    return useSWRNext(
      query ? encode(new PostgrestParser<Result>(query)) : null,
      () => fetcher(query),
      config
    );
  };
};

export const infiniteMiddleware = <Result>(
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
          new PostgrestParser<Result>(query as PostgrestBuilder<Result>)
        );
      },
      typeof fetcher === "function" ? (query) => fetcher(query) : fetcher,
      config
    );
  };
};
