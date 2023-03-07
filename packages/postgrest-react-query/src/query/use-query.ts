import {
  AnyPostgrestResponse,
  isPostgrestBuilder,
} from '@supabase-cache-helpers/postgrest-shared';
import {
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
} from '@supabase/postgrest-js';
import {
  useQuery as useReactQuery,
  UseQueryResult as UseReactQueryResult,
  UseQueryOptions as UseReactQueryOptions,
} from '@tanstack/react-query';

import { encode } from '../lib/key';

type UseQuerySingleReturn<Result> = Omit<
  UseReactQueryResult<PostgrestSingleResponse<Result>['data'], PostgrestError>,
  'refetch'
> &
  Pick<
    UseReactQueryResult<PostgrestSingleResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<PostgrestSingleResponse<Result>, 'count'>;

type UseQueryMaybeSingleReturn<Result> = Omit<
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

type UseQueryReturn<Result> = Omit<
  UseReactQueryResult<PostgrestResponse<Result>['data'], PostgrestError>,
  'refetch'
> &
  Pick<
    UseReactQueryResult<PostgrestResponse<Result>, PostgrestError>,
    'refetch'
  > &
  Pick<PostgrestResponse<Result>, 'count'>;

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
 * Perform a postgrest query
 * @param query
 * @param config
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestSingleResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<PostgrestSingleResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >
): UseQuerySingleReturn<Result>;
function useQuery<Result>(
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >
): UseQueryMaybeSingleReturn<Result>;
function useQuery<Result>(
  query: PromiseLike<PostgrestResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<PostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >
): UseQueryReturn<Result>;
function useQuery<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >
): UseQueryAnyReturn<Result> {
  const { data, ...rest } = useReactQuery<
    AnyPostgrestResponse<Result>,
    PostgrestError
  >(
    encode<Result>(query, false),
    async () => {
      if (isPostgrestBuilder(query)) {
        query = query.throwOnError();
      }
      return await query;
    },
    config
  );

  return { data: data?.data, count: data?.count ?? null, ...rest };
}

export { useQuery };
