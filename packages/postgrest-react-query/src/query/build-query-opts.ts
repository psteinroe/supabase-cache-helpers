import {
  type AnyPostgrestResponse,
  isPostgrestBuilder,
  isPostgrestTransformBuilder,
} from "@supabase-cache-helpers/postgrest-core";
import type { PostgrestError } from "@supabase/postgrest-js";
import type { UseQueryOptions as UseReactQueryOptions } from "@tanstack/react-query";

import { encode } from "../lib/key";

export function buildQueryOpts<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>,
    "queryKey" | "queryFn"
  >,
): UseReactQueryOptions<AnyPostgrestResponse<Result>, PostgrestError> {
  return {
    queryKey: encode<Result>(query, false),
    queryFn: async ({ signal }) => {
      if (isPostgrestTransformBuilder(query)) {
        query = query.abortSignal(signal);
      }
      if (isPostgrestBuilder(query)) {
        query = query.throwOnError();
      }
      return await query;
    },
    ...config,
  };
}
