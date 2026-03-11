import {
  createInfiniteQueryKey,
  createCursorPaginationQueryFn,
  getNextCursorPageParam,
  type CursorPageParam,
  type CursorPaginationOptions,
} from '../lib/pagination';
import { isPlainObject } from '@supabase-cache-helpers/postgrest-core';
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

/**
 * The return type of the `useCursorInfiniteScrollQuery` hook
 */
export type UseCursorInfiniteScrollQueryReturn<
  Result extends Record<string, unknown>,
> = Omit<
  UseInfiniteQueryResult<
    InfiniteData<Result[], CursorPageParam>,
    PostgrestError
  >,
  'data'
> & {
  loadMore: (() => void) | null;
  data: Result[] | undefined;
};

/**
 * Options for the useCursorInfiniteScrollQuery hook
 */
export type UseCursorInfiniteScrollQueryOpts<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
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
} & CursorPaginationOptions<Table, ColumnName> &
  Omit<
    UseInfiniteQueryOptions<
      Result[],
      PostgrestError,
      InfiniteData<Result[], CursorPageParam>,
      Result[],
      string[],
      CursorPageParam
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >;

/**
 * A hook that provides infinite scroll capabilities using cursor-based pagination.
 * Returns flattened data and a `loadMore` callback.
 *
 * @param opts - Options containing the query factory and configuration
 * @returns The infinite scroll query result with flattened data and loadMore callback
 *
 * @example
 * ```tsx
 * const { data, loadMore } = useCursorInfiniteScrollQuery({
 *   query: () => client.from('contact').select('id,name').order('created_at'),
 *   orderBy: 'created_at'
 * });
 * ```
 */
function useCursorInfiniteScrollQuery<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
  RelationName = unknown,
  Relationships = unknown,
>(
  opts: UseCursorInfiniteScrollQueryOpts<
    Options,
    Schema,
    Table,
    Result,
    ColumnName,
    RelationName,
    Relationships
  >,
): UseCursorInfiniteScrollQueryReturn<Result> {
  const { query: queryFactory, orderBy, uqOrderBy, rpcArgs, ...config } = opts;

  const queryKey = queryFactory
    ? createInfiniteQueryKey<Result[]>(queryFactory())
    : null;

  // Determine page size from the query
  const pageSize = useMemo(() => {
    if (!queryFactory) return undefined;
    const query = queryFactory();

    if (rpcArgs) {
      if (query['method'] === 'GET') {
        const limitValue = query['url'].searchParams.get(rpcArgs.limit);
        return limitValue ? parseInt(limitValue, 10) : undefined;
      } else {
        return isPlainObject(query['body'])
          ? (query['body'][rpcArgs.limit] as number | undefined)
          : undefined;
      }
    }

    const limitValue = query['url'].searchParams.get('limit');
    return limitValue ? parseInt(limitValue, 10) : undefined;
  }, [queryFactory, rpcArgs]);

  const { data, fetchNextPage, isFetchingNextPage, ...rest } = useInfiniteQuery<
    Result[],
    PostgrestError,
    InfiniteData<Result[], CursorPageParam>,
    string[],
    CursorPageParam
  >({
    queryKey: queryKey ?? ['postgrest', 'disabled'],
    queryFn: queryFactory
      ? createCursorPaginationQueryFn<
          Options,
          Schema,
          Table,
          Result,
          ColumnName,
          RelationName,
          Relationships
        >(queryFactory, { orderBy, uqOrderBy, rpcArgs })
      : () => Promise.resolve([]),
    enabled: !!queryFactory,
    initialPageParam: null,
    getNextPageParam: getNextCursorPageParam<Result, ColumnName>(
      orderBy,
      uqOrderBy,
      pageSize,
    ),
    ...config,
  });

  const flatData = useMemo(() => {
    if (!data?.pages) return undefined;
    return data.pages.flat();
  }, [data]);

  const hasLoadMore = useMemo(() => {
    if (!data?.pages || data.pages.length === 0 || pageSize === undefined) {
      return false;
    }
    const lastPage = data.pages[data.pages.length - 1];
    return lastPage.length === pageSize;
  }, [data, pageSize]);

  const loadMoreFn = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return {
    data: flatData,
    fetchNextPage,
    isFetchingNextPage,
    loadMore: hasLoadMore && !isFetchingNextPage ? loadMoreFn : null,
    ...rest,
  };
}

export { useCursorInfiniteScrollQuery };
