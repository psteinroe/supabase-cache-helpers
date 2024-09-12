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
 * @param {Omit<UseReactQueryOptions<PostgrestSingleResponse<TransformedResult>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The React Query options.
 * @returns {UseQuerySingleReturn<TransformedResult>} The hook result containing the single item response data.
 */
function useQuery<Result, TransformedResult = Result>(
  query: PromiseLike<PostgrestSingleResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<
      PostgrestSingleResponse<TransformedResult>,
      PostgrestError
    >,
    'queryKey' | 'queryFn'
  > & {
    transformer?: (
      data: PostgrestSingleResponse<Result>['data']
    ) => TransformedResult;
  }
): UseQuerySingleReturn<TransformedResult>;
/**
 * React hook to execute a PostgREST query and return a maybe single item response.
 *
 * @param {PromiseLike<PostgrestMaybeSingleResponse<Result>>} query A promise that resolves to a PostgREST maybe single item response.
 * @param {Omit<UseReactQueryOptions<PostgrestMaybeSingleResponse<TransformedResult>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The React Query options.
 * @returns {UseQueryMaybeSingleReturn<TransformedResult>} The hook result containing the maybe single item response data.
 */
function useQuery<Result, TransformedResult = Result>(
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<
      PostgrestMaybeSingleResponse<TransformedResult>,
      PostgrestError
    >,
    'queryKey' | 'queryFn'
  > & {
    transformer?: (
      data: PostgrestMaybeSingleResponse<Result>['data']
    ) => TransformedResult;
  }
): UseQueryMaybeSingleReturn<TransformedResult>;
/**
 * React hook to execute a PostgREST query.
 *
 * @template Result The expected response data type.
 * @param {PromiseLike<PostgrestResponse<Result>>} query A promise that resolves to a PostgREST response.
 * @param {Omit<UseReactQueryOptions<PostgrestResponse<TransformedResult>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The React Query options.
 * @returns {UseQueryReturn<TransformedResult>} The hook result containing the response data.
 */
function useQuery<Result, TransformedResult = Result>(
  query: PromiseLike<PostgrestResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<PostgrestResponse<TransformedResult>, PostgrestError>,
    'queryKey' | 'queryFn'
  > & {
    transformer?: (data: PostgrestResponse<Result>['data']) => TransformedResult;
  }
): UseQueryReturn<TransformedResult>;

/**
 * React hook to execute a PostgREST query.
 *
 * @template Result The expected response data type.
 * @param {PromiseLike<AnyPostgrestResponse<Result>>} query A promise that resolves to a PostgREST response of any kind.
 * @param {Omit<UseReactQueryOptions<AnyPostgrestResponse<TransformedResult>, PostgrestError>, 'queryKey' | 'queryFn'>} [config] The React Query options.
 * @returns {UseQueryAnyReturn<TransformedResult>} The hook result containing the response data.
 */
function useQuery<Result, TransformedResult = Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<
      AnyPostgrestResponse<TransformedResult>,
      PostgrestError
    >,
    'queryKey' | 'queryFn'
  > & {
    transformer?: (
      data: AnyPostgrestResponse<Result>['data']
    ) => TransformedResult;
  }
): UseQueryAnyReturn<TransformedResult> {
  const { data, ...rest } = useReactQuery<
    AnyPostgrestResponse<TransformedResult>,
    PostgrestError
  >(buildQueryOpts<Result, TransformedResult>(query, config));

  return { data: data?.data, count: data?.count ?? null, ...rest };
}

export { useQuery };
