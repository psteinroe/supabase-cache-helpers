import { encode } from '../lib';
import {
  type AnyPostgrestResponse,
  PostgrestParser,
  isPostgrestBuilder,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/postgrest-js';
import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr';

/**
 * The return type of `useQuery` for `.single()` record results
 */
export type UseQuerySingleReturn<Result> = Omit<
  SWRResponse<PostgrestSingleResponse<Result>['data'], PostgrestError>,
  'mutate'
> &
  Pick<SWRResponse<PostgrestSingleResponse<Result>, PostgrestError>, 'mutate'> &
  Pick<PostgrestSingleResponse<Result>, 'count'>;

/**
 * The return type of `useQuery` for `.maybeSingle()` queries
 */
export type UseQueryMaybeSingleReturn<Result> = Omit<
  SWRResponse<PostgrestMaybeSingleResponse<Result>['data'], PostgrestError>,
  'mutate'
> &
  Pick<
    SWRResponse<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    'mutate'
  > &
  Pick<PostgrestMaybeSingleResponse<Result>, 'count'>;

/**
 * The default return type of `useQuery` queries
 */
export type UseQueryReturn<Result> = Omit<
  SWRResponse<PostgrestResponse<Result>['data'], PostgrestError>,
  'mutate'
> &
  Pick<SWRResponse<PostgrestResponse<Result>, PostgrestError>, 'mutate'> &
  Pick<PostgrestResponse<Result>, 'count'>;

/**
 * The return type of `useQuery` for any type of result
 */
export type UseQueryAnyReturn<Result> = Omit<
  SWRResponse<AnyPostgrestResponse<Result>['data'], PostgrestError>,
  'mutate'
> &
  Pick<SWRResponse<AnyPostgrestResponse<Result>, PostgrestError>, 'mutate'> &
  Pick<AnyPostgrestResponse<Result>, 'count'>;

/**
 * Options for useQuery hook with single result
 */
export type UseQuerySingleOpts<Result> = {
  /** The query to perform */
  query: PromiseLike<PostgrestSingleResponse<Result>> | null;
} & SWRConfiguration<PostgrestSingleResponse<Result>, PostgrestError>;

/**
 * Options for useQuery hook with maybe single result
 */
export type UseQueryMaybeSingleOpts<Result> = {
  /** The query to perform */
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>> | null;
} & SWRConfiguration<PostgrestMaybeSingleResponse<Result>, PostgrestError>;

/**
 * Options for useQuery hook with multiple results
 */
export type UseQueryOpts<Result> = {
  /** The query to perform */
  query: PromiseLike<PostgrestResponse<Result>> | null;
} & SWRConfiguration<PostgrestResponse<Result>, PostgrestError>;

/**
 * Options for useQuery hook with any result type
 */
export type UseQueryAnyOpts<Result> = {
  /** The query to perform */
  query: PromiseLike<AnyPostgrestResponse<Result>> | null;
} & SWRConfiguration<AnyPostgrestResponse<Result>, PostgrestError>;

/**
 * Perform a postgrest query using `useSWR`.
 *
 * @param opts - Options containing the query and SWR configuration
 * @returns The query result
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
  const { data, ...rest } = useSWR<
    AnyPostgrestResponse<Result>,
    PostgrestError
  >(
    query,
    async (q) => {
      if (isPostgrestBuilder(q)) {
        q = q.throwOnError();
      }
      return await q;
    },
    {
      ...config,
      use: [
        ...(config?.use ?? []),
        (useSWRNext) => {
          return (key, fetcher, config) => {
            if (!fetcher) throw new Error('No fetcher provided');

            if (key !== null && !isPostgrestBuilder<Result>(key)) {
              throw new Error('Key is not a PostgrestBuilder');
            }

            // eslint-disable-next-line react-hooks/rules-of-hooks
            return useSWRNext(
              key ? encode(new PostgrestParser<Result>(key), false) : null,
              () => fetcher(key),
              config,
            );
          };
        },
      ],
    },
  );

  return { data: data?.data, count: data?.count ?? null, ...rest };
}

export { useQuery };
