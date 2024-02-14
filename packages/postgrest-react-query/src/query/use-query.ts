import {
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
} from '@supabase/postgrest-js';
import { AnyPostgrestResponse } from '@supabase-cache-helpers/postgrest-core';
import {
  useQuery as useReactQuery,
  UseQueryResult as UseReactQueryResult,
  UseQueryOptions as UseReactQueryOptions,
} from '@tanstack/react-query';

import { buildQueryOpts } from './build-query-opts';

/**
 * Represents the return value of the `useQuery` hook when `query` is expected to return
 * a single row.
 */
export type UseQuerySingleReturn<Result> = Omit<
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
export type UseQueryMaybeSingleReturn<Result> = Omit<
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
export type UseQueryReturn<Result> = Omit<
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
export type UseQueryAnyReturn<Result> = Omit<
  UseReactQueryResult<AnyPostgrestResponse<Result>['data'], PostgrestError>,
  'refetch'
> &
  Pick<
    UseReactQueryResult<AnyPostgrestResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<AnyPostgrestResponse<Result>, 'count'>;

/**
 * React hook to execute a PostgREST query and return a single item response.
 *
 * @param {PromiseLike<PostgrestSingleResponse<Result>>} query A promise that resolves to a PostgREST single item response.
 * @param {Omit<UseReactQueryOptions<PostgrestSingleResponse<Result>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The React Query options.
 * @returns {UseQuerySingleReturn<Result>} The hook result containing the single item response data.
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestSingleResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<PostgrestSingleResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseQuerySingleReturn<Result>;
/**
 * React hook to execute a PostgREST query and return a maybe single item response.
 *
 * @param {PromiseLike<PostgrestMaybeSingleResponse<Result>>} query A promise that resolves to a PostgREST maybe single item response.
 * @param {Omit<UseReactQueryOptions<PostgrestMaybeSingleResponse<Result>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The React Query options.
 * @returns {UseQueryMaybeSingleReturn<Result>} The hook result containing the maybe single item response data.
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryMaybeSingleReturn<Result>;
/**
 * React hook to execute a PostgREST query.
 *
 * @template Result The expected response data type.
 * @param {PromiseLike<PostgrestResponse<Result>>} query A promise that resolves to a PostgREST response.
 * @param {Omit<UseReactQueryOptions<PostgrestResponse<Result>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The React Query options.
 * @returns {UseQueryReturn<Result>} The hook result containing the response data.
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<PostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryReturn<Result>;

/**
 * React hook to execute a PostgREST query.
 *
 * @template Result The expected response data type.
 * @param {PromiseLike<AnyPostgrestResponse<Result>>} query A promise that resolves to a PostgREST response of any kind.
 * @param {Omit<UseReactQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The React Query options.
 * @returns {UseQueryAnyReturn<Result>} The hook result containing the response data.
 */
function useQuery<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryAnyReturn<Result> {
  const { data, ...rest } = useReactQuery<
    AnyPostgrestResponse<Result>,
    PostgrestError
  >(buildQueryOpts<Result>(query, config));

  return { data: data?.data, count: data?.count ?? null, ...rest };
}

export { useQuery };
