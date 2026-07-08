import { buildQueryOpts } from './build-query-opts';
import type { AnyPostgrestResponse } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/postgrest-js';
import {
  type UseQueryOptions as UseReactQueryOptions,
  type UseQueryResult as UseReactQueryResult,
  useQuery as useReactQuery,
} from '@tanstack/react-query';

/**
 * Applies Omit over a union, while preserving its union-ness.
 */
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

/**
 * Represents the return value of the `useQuery` hook when `query` is expected to return
 * a single row.
 */
export type UseQuerySingleReturn<Result> = DistributiveOmit<
  UseReactQueryResult<PostgrestSingleResponse<Result>['data'], PostgrestError>,
  'refetch'
> &
  Pick<
    UseReactQueryResult<PostgrestSingleResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<PostgrestSingleResponse<Result>, 'count'>;

/**
 * Represents the return value of the `useQuery` hook when `query` is expected to return
 * either a single row or an empty response.
 */
export type UseQueryMaybeSingleReturn<Result> = DistributiveOmit<
  UseReactQueryResult<
    PostgrestMaybeSingleResponse<Result>['data'],
    PostgrestError
  >,
  'refetch'
> &
  Pick<
    UseReactQueryResult<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<PostgrestMaybeSingleResponse<Result>, 'count'>;

/**
 * Represents the return value of the `useQuery` hook when `query` is expected to return
 * one or more rows.
 */
export type UseQueryReturn<Result> = DistributiveOmit<
  UseReactQueryResult<PostgrestResponse<Result>['data'], PostgrestError>,
  'refetch'
> &
  Pick<
    UseReactQueryResult<PostgrestResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<PostgrestResponse<Result>, 'count'>;

/**
 * Represents the return value of the `useQuery` hook when the type of the query response
 * is not known.
 */
export type UseQueryAnyReturn<Result> = DistributiveOmit<
  UseReactQueryResult<AnyPostgrestResponse<Result>['data'], PostgrestError>,
  'refetch'
> &
  Pick<
    UseReactQueryResult<AnyPostgrestResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<AnyPostgrestResponse<Result>, 'count'>;

/**
 * Options for useQuery hook with single result
 */
export type UseQuerySingleOpts<Result> = {
  /** The query to perform */
  query: PromiseLike<PostgrestSingleResponse<Result>>;
} & Omit<
  UseReactQueryOptions<PostgrestSingleResponse<Result>, PostgrestError>,
  'queryKey' | 'queryFn'
>;

/**
 * Options for useQuery hook with maybe single result
 */
export type UseQueryMaybeSingleOpts<Result> = {
  /** The query to perform */
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>>;
} & Omit<
  UseReactQueryOptions<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
  'queryKey' | 'queryFn'
>;

/**
 * Options for useQuery hook with multiple results
 */
export type UseQueryOpts<Result> = {
  /** The query to perform */
  query: PromiseLike<PostgrestResponse<Result>>;
} & Omit<
  UseReactQueryOptions<PostgrestResponse<Result>, PostgrestError>,
  'queryKey' | 'queryFn'
>;

/**
 * Options for useQuery hook with any result type
 */
export type UseQueryAnyOpts<Result> = {
  /** The query to perform */
  query: PromiseLike<AnyPostgrestResponse<Result>>;
} & Omit<
  UseReactQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>,
  'queryKey' | 'queryFn'
>;

/**
 * React hook to execute a PostgREST query.
 *
 * @param opts - Options containing the query and React Query configuration
 * @returns The hook result containing the response data
 *
 * @example
 * ```tsx
 * const { data } = useQuery({
 *   query: client.from('contact').select('id,name').single()
 * });
 * ```
 */
function useQuery<Result>(
  opts: UseQuerySingleOpts<Result>,
): UseQuerySingleReturn<Result>;
function useQuery<Result>(
  opts: UseQueryMaybeSingleOpts<Result>,
): UseQueryMaybeSingleReturn<Result>;
function useQuery<Result>(opts: UseQueryOpts<Result>): UseQueryReturn<Result>;
function useQuery<Result>(
  opts: UseQueryAnyOpts<Result>,
): UseQueryAnyReturn<Result> {
  const { query, ...config } = opts;
  const result = useReactQuery<AnyPostgrestResponse<Result>, PostgrestError>(
    buildQueryOpts<Result>(query, config),
  );

  // isPending and isLoadingError are the only cases in which no data is present
  if (result.isPending || result.isLoadingError) {
    return {
      ...result,
      data: undefined,
      count: null,
    } as UseQueryAnyReturn<Result>;
  }

  return {
    ...result,
    data: result.data?.data,
    count: result.data?.count,
  } as UseQueryAnyReturn<Result>;
}

export { useQuery };
