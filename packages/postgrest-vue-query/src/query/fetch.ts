import {
  PostgrestError,
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/postgrest-js';
import { AnyPostgrestResponse } from '@supabase-cache-helpers/postgrest-core';
import { FetchQueryOptions, QueryClient } from '@tanstack/vue-query';

import { buildQueryOpts } from './build-query-opts';

function fetchQuery<Result>(
  queryClient: QueryClient,
  query: PromiseLike<PostgrestSingleResponse<Result>>,
  config?: Omit<
    FetchQueryOptions<PostgrestSingleResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): Promise<PostgrestSingleResponse<Result>>;
function fetchQuery<Result>(
  queryClient: QueryClient,
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
  config?: Omit<
    FetchQueryOptions<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): Promise<PostgrestMaybeSingleResponse<Result>>;
function fetchQuery<Result>(
  queryClient: QueryClient,
  query: PromiseLike<PostgrestResponse<Result>>,
  config?: Omit<
    FetchQueryOptions<PostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): Promise<PostgrestResponse<Result>>;

async function fetchQuery<Result>(
  queryClient: QueryClient,
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    FetchQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): Promise<AnyPostgrestResponse<Result>> {
  return await queryClient.fetchQuery<
    AnyPostgrestResponse<Result>,
    PostgrestError
  >(buildQueryOpts(query, config));
}

export { fetchQuery };
