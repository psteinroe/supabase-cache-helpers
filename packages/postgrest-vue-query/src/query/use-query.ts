import {
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
} from '@supabase/postgrest-js';
import { AnyPostgrestResponse } from '@supabase-cache-helpers/postgrest-core';
import {
  useQuery as useVueQuery,
  UseQueryReturnType as UseVueQueryResult,
  UseQueryOptions as UseVueQueryOptions,
} from '@tanstack/vue-query';

import { buildQueryOpts } from './build-query-opts';

/**
 * Represents the return value of the `useQuery` hook when `query` is expected to return
 * a single row.
 */
export type UseQuerySingleReturn<Result> = Omit<
  UseVueQueryResult<PostgrestSingleResponse<Result>['data'], PostgrestError>,
  'refetch'
> &
  Pick<
    UseVueQueryResult<PostgrestSingleResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<PostgrestSingleResponse<Result>, 'count'>;

/**
 * Represents the return value of the `useQuery` hook when `query` is expected to return
 * either a single row or an empty response.
 */
export type UseQueryMaybeSingleReturn<Result> = Omit<
  UseVueQueryResult<
    PostgrestMaybeSingleResponse<Result>['data'],
    PostgrestError
  >,
  'refetch'
> &
  Pick<
    UseVueQueryResult<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<PostgrestMaybeSingleResponse<Result>, 'count'>;

/**
 * Represents the return value of the `useQuery` hook when `query` is expected to return
 * one or more rows.
 */
export type UseQueryReturn<Result> = Omit<
  UseVueQueryResult<PostgrestResponse<Result>['data'], PostgrestError>,
  'refetch'
> &
  Pick<
    UseVueQueryResult<PostgrestResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<PostgrestResponse<Result>, 'count'>;

/**
 * Represents the return value of the `useQuery` hook when the type of the query response
 * is not known.
 */
export type UseQueryAnyReturn<Result> = Omit<
  UseVueQueryResult<AnyPostgrestResponse<Result>['data'], PostgrestError>,
  'refetch'
> &
  Pick<
    UseVueQueryResult<AnyPostgrestResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<AnyPostgrestResponse<Result>, 'count'>;

/**
 * Vue hook to execute a PostgREST query and return a single item response.
 *
 * @param {PromiseLike<PostgrestSingleResponse<Result>>} query A promise that resolves to a PostgREST single item response.
 * @param {Omit<UseVueQueryOptions<PostgrestSingleResponse<Result>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The Vue Query options.
 * @returns {UseQuerySingleReturn<Result>} The hook result containing the single item response data.
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestSingleResponse<Result>>,
  config?: Omit<
    UseVueQueryOptions<PostgrestSingleResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseQuerySingleReturn<Result>;
/**
 * Vue hook to execute a PostgREST query and return a maybe single item response.
 *
 * @param {PromiseLike<PostgrestMaybeSingleResponse<Result>>} query A promise that resolves to a PostgREST maybe single item response.
 * @param {Omit<UseVueQueryOptions<PostgrestMaybeSingleResponse<Result>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The Vue Query options.
 * @returns {UseQueryMaybeSingleReturn<Result>} The hook result containing the maybe single item response data.
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
  config?: Omit<
    UseVueQueryOptions<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryMaybeSingleReturn<Result>;
/**
 * Vue hook to execute a PostgREST query.
 *
 * @template Result The expected response data type.
 * @param {PromiseLike<PostgrestResponse<Result>>} query A promise that resolves to a PostgREST response.
 * @param {Omit<UseVueQueryOptions<PostgrestResponse<Result>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The Vue Query options.
 * @returns {UseQueryReturn<Result>} The hook result containing the response data.
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestResponse<Result>>,
  config?: Omit<
    UseVueQueryOptions<PostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryReturn<Result>;

/**
 * Vue hook to execute a PostgREST query.
 *
 * @template Result The expected response data type.
 * @param {PromiseLike<AnyPostgrestResponse<Result>>} query A promise that resolves to a PostgREST response of any kind.
 * @param {Omit<UseVueQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The Vue Query options.
 * @returns {UseQueryAnyReturn<Result>} The hook result containing the response data.
 */
function useQuery<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    UseVueQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryAnyReturn<Result> {
  const { data, ...rest } = useVueQuery<
    AnyPostgrestResponse<Result>,
    PostgrestError
  >(buildQueryOpts<Result>(query, config));

  // TODO: data: data.value || Type 'AnyPostgrestResponse<Result> | undefined' is not assignable to type 'Ref<undefined> | Ref<Result | Result[] | null>'
  // TODO: data: data.value?.data || Type 'Result | Result[] | null | undefined' is not assignable to type 'Ref<undefined> | Ref<Result | Result[] | null>'.
  return {
    data: data.value?.data,
    count: data.value?.count ?? null,
    ...rest,
  };
}

export { useQuery };
