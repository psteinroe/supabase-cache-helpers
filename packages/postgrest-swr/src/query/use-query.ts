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

import { middleware } from '../lib';

type UseQuerySingleReturn<Result> = Omit<
  SWRResponse<PostgrestSingleResponse<Result>['data'], PostgrestError>,
  'mutate'
> &
  Pick<SWRResponse<PostgrestSingleResponse<Result>, PostgrestError>, 'mutate'> &
  Pick<PostgrestSingleResponse<Result>, 'count'>;

type UseQueryMaybeSingleReturn<Result> = Omit<
  SWRResponse<PostgrestMaybeSingleResponse<Result>['data'], PostgrestError>,
  'mutate'
> &
  Pick<
    SWRResponse<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    'mutate'
  > &
  Pick<PostgrestMaybeSingleResponse<Result>, 'count'>;

type UseQueryReturn<Result> = Omit<
  SWRResponse<PostgrestResponse<Result>['data'], PostgrestError>,
  'mutate'
> &
  Pick<SWRResponse<PostgrestResponse<Result>, PostgrestError>, 'mutate'> &
  Pick<PostgrestResponse<Result>, 'count'>;

export type UseQueryAnyReturn<Result> = Omit<
  SWRResponse<AnyPostgrestResponse<Result>['data'], PostgrestError>,
  'mutate'
> &
  Pick<SWRResponse<AnyPostgrestResponse<Result>, PostgrestError>, 'mutate'> &
  Pick<AnyPostgrestResponse<Result>, 'count'>;

/**
 * Perform a postgrest query
 * @param query
 * @param config
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestSingleResponse<Result>> | null,
  config?: SWRConfiguration
): UseQuerySingleReturn<Result>;
function useQuery<Result>(
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>> | null,
  config?: SWRConfiguration
): UseQueryMaybeSingleReturn<Result>;
function useQuery<Result>(
  query: PromiseLike<PostgrestResponse<Result>> | null,
  config?: SWRConfiguration
): UseQueryReturn<Result>;
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
      use: [...(config?.use ?? []), middleware],
    }
  );

  return { data: data?.data, count: data?.count ?? null, ...rest };
}

export { useQuery };
