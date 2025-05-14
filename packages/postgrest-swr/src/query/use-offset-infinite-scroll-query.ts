import {
  type PostgrestHasMorePaginationCacheData,
  type PostgrestHasMorePaginationResponse,
  createOffsetPaginationHasMoreFetcher,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';
import { useCallback } from 'react';
import type { Middleware } from 'swr';
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteResponse,
} from 'swr/infinite';

import { createOffsetKeyGetter, decode, infiniteMiddleware } from '../lib';

export type SWROffsetInfiniteScrollPostgrestResponse<Result> = Omit<
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
 * @deprecated Use SWROffsetInfiniteScrollPostgrestResponse instead.
 */
export type SWRInfinityScrollPostgrestResponse<Result> =
  SWROffsetInfiniteScrollPostgrestResponse<Result>;

/**
 * The return value of useInfiniteScrollQuery hook.
 */
export type UseOffsetInfiniteScrollQueryReturn<
  Result extends Record<string, unknown>,
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
 * @deprecated Use UseOffsetInfiniteScrollQueryReturn instead.
 */
export type UseInfiniteScrollQueryReturn<
  Result extends Record<string, unknown>,
> = UseOffsetInfiniteScrollQueryReturn<Result>;

/**
 * A hook that provides infinite scroll capabilities to PostgREST queries using SWR.
 *
 * @param {PostgrestTransformBuilder<Schema, Table, Result[]> | null} query - The PostgREST query.
 * @param {SWRInfiniteConfiguration & { pageSize?: number }} [config] - The SWRInfinite configuration.
 * @returns {UseInfiniteScrollQueryReturn<Result>} - The infinite scroll query result.
 */
function useOffsetInfiniteScrollQuery<
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
  > | null,
  config?: SWRInfiniteConfiguration<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError
  > & {
    pageSize?: number;
    applyBody?: (params: { limit?: number; offset?: number }) => Record<
      string,
      unknown
    >;
  },
): UseOffsetInfiniteScrollQueryReturn<Result> {
  const { data, setSize, size, isValidating, ...rest } = useSWRInfinite<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError
  >(
    createOffsetKeyGetter(query, config?.pageSize ?? 20, config?.applyBody),
    createOffsetPaginationHasMoreFetcher<Schema, Table, Result, string>(
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
      config?.pageSize ?? 20,
      config?.applyBody,
    ),
    {
      ...config,
      use: [
        ...(config?.use ?? []),
        infiniteMiddleware as unknown as Middleware,
      ],
    },
  );

  const hasMore =
    Array.isArray(data) && data.length > 0 && data[data.length - 1].hasMore;

  const loadMoreFn = useCallback(() => setSize(size + 1), [size, setSize]);

  return {
    data: (Array.isArray(data) ? data : []).flatMap((p) => p.data),
    size,
    setSize,
    loadMore: hasMore ? loadMoreFn : null,
    isValidating,
    ...rest,
  };
}

/**
 * @deprecated Use UseOffsetInfiniteScrollQuery instead.
 */
const useInfiniteScrollQuery = useOffsetInfiniteScrollQuery;

export { useInfiniteScrollQuery, useOffsetInfiniteScrollQuery };
