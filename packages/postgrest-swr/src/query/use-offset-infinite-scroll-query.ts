import {
  createOffsetKeyGetter,
  decodeOffsetPaginationKey,
  infiniteMiddleware,
} from '../lib';
import {
  type PostgrestHasMorePaginationCacheData,
  type PostgrestHasMorePaginationResponse,
  createOffsetPaginationHasMoreFetcher,
} from '@supabase-cache-helpers/postgrest-core';
import { GenericSchema } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { useCallback } from 'react';
import type { Middleware } from 'swr';
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteResponse,
} from 'swr/infinite';

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
 * Options for the useOffsetInfiniteScrollQuery hook
 */
export type UseOffsetInfiniteScrollQueryOpts<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
> = {
  /** The query factory function that returns a PostgrestTransformBuilder */
  query:
    | (() => PostgrestTransformBuilder<
        Options,
        Schema,
        Table,
        Result[],
        RelationName,
        Relationships
      >)
    | null;
  /** Number of items per page (default: 20) */
  pageSize?: number;
  /** RPC argument names for limit and offset */
  rpcArgs?: { limit: string; offset: string };
} & SWRInfiniteConfiguration<
  PostgrestHasMorePaginationResponse<Result>,
  PostgrestError
>;

/**
 * A hook that provides infinite scroll capabilities to PostgREST queries using SWR.
 *
 * @param opts - Options containing the query factory and configuration
 * @returns The infinite scroll query result
 *
 * @example
 * ```tsx
 * const { data, loadMore } = useOffsetInfiniteScrollQuery({
 *   query: () => client.from('contact').select('id,name'),
 *   pageSize: 10
 * });
 * ```
 */
function useOffsetInfiniteScrollQuery<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
>(
  opts: UseOffsetInfiniteScrollQueryOpts<
    Options,
    Schema,
    Table,
    Result,
    RelationName,
    Relationships
  >,
): UseOffsetInfiniteScrollQueryReturn<Result> {
  const { query: queryFactory, pageSize = 20, rpcArgs, ...config } = opts;

  const { data, setSize, size, isValidating, ...rest } = useSWRInfinite<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError
  >(
    createOffsetKeyGetter(queryFactory, { pageSize, rpcArgs }),
    createOffsetPaginationHasMoreFetcher<
      Options,
      Schema,
      Table,
      Result,
      string
    >(queryFactory, {
      decode: (key: string) => decodeOffsetPaginationKey(key, rpcArgs),
      pageSize,
      rpcArgs,
    }),
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
    loadMore: hasMore && !isValidating ? loadMoreFn : null,
    isValidating,
    ...rest,
  };
}

export { useOffsetInfiniteScrollQuery };
