import {
  createInfiniteQueryKey,
  createOffsetPaginationHasMoreQueryFn,
  getNextOffsetPageParam,
} from '../lib/pagination';
import type { GenericSchema } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import {
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

type HasMorePage<Result> = { data: Result[]; hasMore: boolean };

/**
 * The return type of the `useOffsetInfiniteScrollQuery` hook
 */
export type UseOffsetInfiniteScrollQueryReturn<
  Result extends Record<string, unknown>,
> = Omit<
  UseInfiniteQueryResult<
    InfiniteData<HasMorePage<Result>, number>,
    PostgrestError
  >,
  'data'
> & {
  loadMore: (() => void) | null;
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
} & Omit<
  UseInfiniteQueryOptions<
    HasMorePage<Result>,
    PostgrestError,
    InfiniteData<HasMorePage<Result>, number>,
    HasMorePage<Result>,
    string[],
    number
  >,
  'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
>;

/**
 * A hook that provides infinite scroll capabilities to PostgREST queries.
 * Returns flattened data and a `loadMore` callback.
 *
 * @param opts - Options containing the query factory and configuration
 * @returns The infinite scroll query result with flattened data and loadMore callback
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

  const queryKey = queryFactory
    ? createInfiniteQueryKey<Result[]>(queryFactory())
    : null;

  const { data, fetchNextPage, isFetchingNextPage, ...rest } = useInfiniteQuery<
    HasMorePage<Result>,
    PostgrestError,
    InfiniteData<HasMorePage<Result>, number>,
    string[],
    number
  >({
    queryKey: queryKey ?? ['postgrest', 'disabled'],
    queryFn: queryFactory
      ? createOffsetPaginationHasMoreQueryFn<
          Options,
          Schema,
          Table,
          Result,
          RelationName,
          Relationships
        >(queryFactory, { pageSize, rpcArgs })
      : () => Promise.resolve({ data: [], hasMore: false }),
    enabled: !!queryFactory,
    initialPageParam: 0,
    getNextPageParam: getNextOffsetPageParam(pageSize),
    ...config,
  });

  const flatData = useMemo(() => {
    if (!data?.pages) return undefined;
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const hasMore = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return false;
    return data.pages[data.pages.length - 1].hasMore;
  }, [data]);

  const loadMoreFn = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return {
    data: flatData,
    fetchNextPage,
    isFetchingNextPage,
    loadMore: hasMore && !isFetchingNextPage ? loadMoreFn : null,
    ...rest,
  };
}

export { useOffsetInfiniteScrollQuery };
