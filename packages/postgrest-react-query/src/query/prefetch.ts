import {
  type AnyPostgrestResponse,
  isPostgrestBuilder,
} from "@supabase-cache-helpers/postgrest-core";
import type {
  PostgrestError,
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/postgrest-js";
import type { FetchQueryOptions, QueryClient } from "@tanstack/react-query";

import { encode } from "../lib";
import { buildQueryOpts } from "./build-query-opts";

function prefetchQuery<Result>(
  queryClient: QueryClient,
  query: PromiseLike<PostgrestSingleResponse<Result>>,
  config?: Omit<
    FetchQueryOptions<PostgrestSingleResponse<Result>, PostgrestError>,
    "queryKey" | "queryFn"
  >,
): Promise<void>;
function prefetchQuery<Result>(
  queryClient: QueryClient,
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
  config?: Omit<
    FetchQueryOptions<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    "queryKey" | "queryFn"
  >,
): Promise<void>;
function prefetchQuery<Result>(
  queryClient: QueryClient,
  query: PromiseLike<PostgrestResponse<Result>>,
  config?: Omit<
    FetchQueryOptions<PostgrestResponse<Result>, PostgrestError>,
    "queryKey" | "queryFn"
  >,
): Promise<void>;

async function prefetchQuery<Result>(
  queryClient: QueryClient,
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    FetchQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>,
    "queryKey" | "queryFn"
  >,
) {
  await queryClient.prefetchQuery<AnyPostgrestResponse<Result>, PostgrestError>(
    buildQueryOpts(query, config),
  );
}

function fetchQueryInitialData<Result>(
  query: PromiseLike<PostgrestSingleResponse<Result>>,
): Promise<[string[], PostgrestSingleResponse<Result>]>;

function fetchQueryInitialData<Result>(
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
): Promise<[string[], PostgrestMaybeSingleResponse<Result>]>;

function fetchQueryInitialData<Result>(
  query: PromiseLike<PostgrestResponse<Result>>,
): Promise<[string[], PostgrestResponse<Result>]>;

async function fetchQueryInitialData<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
): Promise<[string[], AnyPostgrestResponse<Result>]> {
  if (!isPostgrestBuilder<Result>(query)) {
    throw new Error("Query is not a PostgrestBuilder");
  }

  return [encode(query, false), await query.throwOnError()];
}

export { prefetchQuery, fetchQueryInitialData };
