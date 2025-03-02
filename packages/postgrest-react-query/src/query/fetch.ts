import type { AnyPostgrestResponse } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import type { FetchQueryOptions, QueryClient } from '@tanstack/react-query';
import {
  type PostgrestHasMorePaginationResponse,
  offsetPaginationHasMoreFetcher,
} from '@supabase-cache-helpers/postgrest-core';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';

import { buildQueryOpts } from './build-query-opts';
import { createInfiniteOffsetKeyGetter } from '../lib/key';

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

/**
 * Fetches data for offset pagination with hasMore indicator for use as fallback data
 * 
 * @param query The postgrest query builder
 * @param pageSize The number of items per page
 * @returns A tuple with the query key and the fallback data
 */
export async function fetchOffsetPaginationHasMoreFallbackData<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Schema,
    Table,
    Result[],
    RelationName,
    Relationships
  >,
  pageSize: number,
): Promise<
  [
    string[],
    {
      pages: PostgrestHasMorePaginationResponse<Result>[];
      pageParams: number[];
    },
  ]
> {
  const queryKey = createInfiniteOffsetKeyGetter<Schema, Table, Result, RelationName, Relationships>(query, pageSize);
  
  const result = await offsetPaginationHasMoreFetcher(query, {
    limit: pageSize,
    offset: 0,
    pageSize,
  });
  
  return [
    queryKey,
    {
      pages: [result as PostgrestHasMorePaginationResponse<Result>],
      pageParams: [0],
    },
  ];
}

export { fetchQuery };
