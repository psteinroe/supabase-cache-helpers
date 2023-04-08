import { createPaginationHasMoreFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import {
  PostgrestHasMorePaginationCacheData,
  PostgrestHasMorePaginationResponse,
} from '@supabase-cache-helpers/postgrest-shared';
import {
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/module/types';
import { useMemo } from 'react';
import { Middleware } from 'swr';
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from 'swr/infinite';

import { createKeyGetter, infiniteMiddleware, decode } from '../lib';

export type SWRInfiniteScrollPostgrestResponse<Result> = Omit<
  SWRInfiniteResponse<
    PostgrestHasMorePaginationCacheData<Result>,
    PostgrestError
  >,
  'data'
> & {
  loadMore: null | (() => void);
  data: Result[] | undefined;
};

/**
 * The return value of useInfiniteScrollQuery hook.
 */
export type UseInfiniteScrollQueryReturn<
  Result extends Record<string, unknown>
> = Omit<
  SWRInfiniteResponse<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError
  >,
  'data'
> & {
  loadMore: null | (() => void);
  data: Result[] | undefined;
};

/**
 * A hook that provides infinite scroll capabilities to PostgREST queries using SWR.
 *
 * @param {PostgrestTransformBuilder<Schema, Table, Result[]> | null} query - The PostgREST query.
 * @param {SWRInfiniteConfiguration & { pageSize?: number }} [config] - The SWRInfinite configuration.
 * @returns {UseInfiniteScrollQueryReturn<Result>} - The infinite scroll query result.
 */
function useInfiniteScrollQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>
>(
  query: PostgrestTransformBuilder<Schema, Table, Result[]> | null,
  config?: SWRInfiniteConfiguration & { pageSize?: number }
): UseInfiniteScrollQueryReturn<Result> {
  const { data, setSize, size, ...rest } = useSWRInfinite<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError
  >(
    createKeyGetter(query, config?.pageSize ?? 20),
    createPaginationHasMoreFetcher<Schema, Table, Result, string>(
      query,
      (key: string) => {
        const decodedKey = decode(key);
        if (!decodedKey) {
          throw new Error('Not a SWRPostgrest key');
        }
        return {
          limit: decodedKey.limit,
          offset: decodedKey.offset,
        };
      },
      config?.pageSize ?? 20
    ),
    {
      ...config,
      use: [
        ...(config?.use ?? []),
        infiniteMiddleware as unknown as Middleware,
      ],
    }
  );

  const { data: flatData, hasMore } = useMemo(() => {
    return {
      data: (data ?? []).flatMap((p) => p.data),
      hasMore:
        Array.isArray(data) && data.length > 0 && data[data.length - 1].hasMore,
    };
  }, [data]);

  return {
    data: flatData,
    size,
    setSize,
    loadMore: hasMore ? () => setSize(size + 1) : null,
    ...rest,
  };
}

export { useInfiniteScrollQuery };
