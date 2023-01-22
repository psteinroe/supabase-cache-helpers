import { PostgrestParser } from "@supabase-cache-helpers/postgrest-filter";
import { isPostgrestBuilder } from "@supabase-cache-helpers/postgrest-shared";
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
    if (!fetcher) throw new Error("No fetcher provided");

    if (key !== null && !isPostgrestBuilder<Result>(key)) {
      throw new Error("Key is not a PostgrestBuilder");
    }

    return useSWRNext(
      key ? encode(new PostgrestParser<Result>(key)) : null,
      () => fetcher(key),
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
        // todo use type guard
        const query = keyFn(index, previousPageData);
        if (!query) return null;
        if (!isPostgrestBuilder<Result>(query)) {
          throw new Error("Key is not a PostgrestBuilder");
        }
        return encode(new PostgrestParser<Result>(query));
      },
      typeof fetcher === "function" ? (query) => fetcher(query) : fetcher,
      config
    );
  };
};
