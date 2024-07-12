import {
  PostgrestParser,
  isPostgrestBuilder,
} from "@supabase-cache-helpers/postgrest-core";
import type {
  SWRInfiniteConfiguration,
  SWRInfiniteFetcher,
  SWRInfiniteHook,
  SWRInfiniteKeyLoader,
} from "swr/infinite";

import { encode } from "./encode";

export const infiniteMiddleware = <Result>(
  useSWRInfiniteNext: SWRInfiniteHook,
) => {
  return (
    keyFn: SWRInfiniteKeyLoader,
    fetcher: SWRInfiniteFetcher,
    config: SWRInfiniteConfiguration,
  ) => {
    return useSWRInfiniteNext(
      (index, previousPageData) => {
        // todo use type guard
        const query = keyFn(index, previousPageData);
        if (!query) return null;
        if (!isPostgrestBuilder<Result>(query)) {
          throw new Error("Key is not a PostgrestBuilder");
        }

        return encode(new PostgrestParser<Result>(query), true);
      },
      typeof fetcher === "function" ? (query) => fetcher(query) : fetcher,
      config,
    );
  };
};
