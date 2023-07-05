import { PostgrestParser } from '@supabase-cache-helpers/postgrest-filter';
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
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';

import { encode } from '../lib';

/**
 * The return type of `useQuery` for `.single()` record results
 */
type UseQuerySingleReturn<Result> = Omit<
  SWRResponse<PostgrestSingleResponse<Result>['data'], PostgrestError>,
  'mutate'
> &
  Pick<SWRResponse<PostgrestSingleResponse<Result>, PostgrestError>, 'mutate'> &
  Pick<PostgrestSingleResponse<Result>, 'count'>;

/**
 * The return type of `useQuery` for `.maybeSingle()` queries
 */
type UseQueryMaybeSingleReturn<Result> = Omit<
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
type UseQueryReturn<Result> = Omit<
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
 * Perform a postgrest query using `useSWR`.
 *
 * @param {PromiseLike<PostgrestSingleResponse<Result>> | null} query - The query to perform
 * @param {SWRConfiguration} [config] - The configuration for `useSWR`
 * @returns {UseQuerySingleReturn<Result>} - The query result
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestSingleResponse<Result>> | null,
  config?: SWRConfiguration
): UseQuerySingleReturn<Result>;
/**
 * Perform a postgrest query using `useSWR`.
 *
 * @param {PromiseLike<PostgrestMaybeSingleResponse<Result>> | null} query - The query to perform
 * @param {SWRConfiguration} [config] - The configuration for `useSWR`
 * @returns {UseQueryMaybeSingleReturn<Result>} - The query result
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>> | null,
  config?: SWRConfiguration
): UseQueryMaybeSingleReturn<Result>;
/**
 * Perform a postgrest query using `useSWR`.
 *
 * @param {PromiseLike<PostgrestResponse<Result>> | null} query - The query to perform
 * @param {SWRConfiguration} [config] - The configuration for `useSWR`
 * @returns {UseQueryReturn<Result>} - The query result
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestResponse<Result>> | null,
  config?: SWRConfiguration
): UseQueryReturn<Result>;
/**
 * Perform a postgrest query using `useSWR`.
 *
 * @param {PromiseLike<AnyPostgrestResponse<Result>> | null} query - The query to perform
 * @param {SWRConfiguration} [config] - The configuration for `useSWR`
 * @returns {UseQueryAnyReturn<Result>} - The query result
 */
function useQuery<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>> | null,
  config?: SWRConfiguration
): UseQueryAnyReturn<Result> {
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
              config
            );
          };
        },
      ],
    }
  );

  return { data: data?.data, count: data?.count ?? null, ...rest };
}

export { useQuery };
