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
import { useCallback, useMemo, useState } from 'react';

type HasMorePage<Result> = { data: Result[]; hasMore: boolean };

/**
 * The return type of the `useInfiniteOffsetPaginationQuery` hook
 */
export type UseInfiniteOffsetPaginationQueryReturn<
  Result extends Record<string, unknown>,
> = Omit<
  UseInfiniteQueryResult<
    InfiniteData<HasMorePage<Result>, number>,
    PostgrestError
  >,
  'data'
> & {
  pages: Result[][] | undefined;
  currentPage: Result[];
  pageIndex: number;
  setPage: (idx: number) => void;
  nextPage: (() => void) | null;
  previousPage: (() => void) | null;
};

/**
 * Options for the useInfiniteOffsetPaginationQuery hook
 */
export type UseInfiniteOffsetPaginationQueryOpts<
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
 * A hook for paginating through a PostgREST response with page navigation.
 * Provides nextPage, previousPage, and setPage controls.
 *
 * @param opts - Options containing the query factory and configuration
 * @returns An object containing the paginated data and navigation functions
 *
 * @example
 * ```tsx
 * const { currentPage, nextPage, previousPage, setPage } = useInfiniteOffsetPaginationQuery({
 *   query: () => client.from('contact').select('id,name'),
 *   pageSize: 10
 * });
 * ```
 */
function useInfiniteOffsetPaginationQuery<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
>(
  opts: UseInfiniteOffsetPaginationQueryOpts<
    Options,
    Schema,
    Table,
    Result,
    RelationName,
    Relationships
  >,
): UseInfiniteOffsetPaginationQueryReturn<Result> {
  const { query: queryFactory, pageSize = 20, rpcArgs, ...config } = opts;

  const queryKey = queryFactory
    ? createInfiniteQueryKey<Result[]>(queryFactory())
    : null;

  const { data, fetchNextPage, isFetching, isFetchingNextPage, ...rest } =
    useInfiniteQuery<
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

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const parsedPages = useMemo(() => {
    if (!data?.pages) return undefined;
    return data.pages.map((p) => p.data);
  }, [data]);

  const hasMore = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return false;
    return data.pages[data.pages.length - 1].hasMore;
  }, [data]);

  const totalFetchedPages = data?.pages?.length ?? 0;

  const setPage = useCallback(
    (idx: number) => {
      if (idx > totalFetchedPages - 1) {
        // Need to fetch more pages first
        fetchNextPage().then(() => {
          setCurrentPageIndex(idx);
        });
      } else {
        setCurrentPageIndex(idx);
      }
    },
    [totalFetchedPages, fetchNextPage],
  );

  const nextPageFn = useCallback(() => {
    if (currentPageIndex === totalFetchedPages - 1) {
      // Need to fetch the next page
      fetchNextPage().then(() => {
        setCurrentPageIndex((page) => page + 1);
      });
    } else {
      setCurrentPageIndex((page) => page + 1);
    }
  }, [currentPageIndex, totalFetchedPages, fetchNextPage]);

  const previousPageFn = useCallback(
    () => setCurrentPageIndex((current) => current - 1),
    [],
  );

  const isLoadingAny = isFetching || isFetchingNextPage;
  const canGoNext =
    !isLoadingAny && (hasMore || currentPageIndex < totalFetchedPages - 1);
  const canGoPrevious = !isLoadingAny && currentPageIndex > 0;

  return {
    pages: parsedPages,
    currentPage: parsedPages?.[currentPageIndex] ?? [],
    pageIndex: currentPageIndex,
    setPage,
    nextPage: canGoNext ? nextPageFn : null,
    previousPage: canGoPrevious ? previousPageFn : null,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    ...rest,
  };
}

export { useInfiniteOffsetPaginationQuery };
