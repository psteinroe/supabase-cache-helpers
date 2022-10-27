import { BareFetcher, Key, Middleware, SWRConfiguration, SWRHook } from "swr";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { PostgrestParser } from "@supabase-cache-helpers/postgrest-filter";
import {
  SWRInfiniteConfiguration,
  SWRInfiniteFetcher,
  SWRInfiniteHook,
  SWRInfiniteKeyLoader,
} from "swr/infinite";
import { encode } from "./encode";
import { GenericSchema } from "@supabase/postgrest-js/dist/module/types";

export const middleware: Middleware = <
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
  useSWRNext: SWRHook
) => {
  return (
    key: Key,
    fetcher: BareFetcher<Result> | null,
    config: SWRConfiguration
  ) => {
    const query = key as PostgrestFilterBuilder<Schema, Table, Result>;
    if (!fetcher) throw new Error("No fetcher provided");
    return useSWRNext(
      encode(new PostgrestParser<Schema, Table, Result>(query)),
      () => fetcher(query),
      config
    );
  };
};

export const infiniteMiddleware = <
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
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
          new PostgrestParser<Schema, Table, Result>(
            query as PostgrestFilterBuilder<Schema, Table, Result>
          )
        );
      },
      typeof fetcher === "function" ? (query) => fetcher(query) : fetcher,
      config
    );
  };
};
