import {
  type PostgrestHasMorePaginationResponse,
  createOffsetPaginationHasMoreFetcher,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';
import { useCallback, useState, useEffect } from 'react';
import {
  useInfiniteQuery,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';

import { createInfiniteOffsetKeyGetter, decode } from '../lib/key';

export type InfiniteOffsetPaginationPostgrestResponse<Result extends Record<string, unknown>> = Omit<
  UseInfiniteQueryResult<
    InfiniteData<PostgrestHasMorePaginationResponse<Result>>,
    PostgrestError
  >,
  'data' | 'fetchNextPage' | 'fetchPreviousPage'
> & {
  pages: Result[][];
  currentPage: null | Result[];
  pageIndex: number;
  setPage: (idx: number) => void;
  nextPage: undefined | (() => void);
  previousPage: undefined | (() => void);
};

/**
 * The return value of the `useInfiniteOffsetPaginationQuery` hook.
 */
export type UseInfiniteOffsetPaginationQueryReturn<
  Result extends Record<string, unknown>,
> = InfiniteOffsetPaginationPostgrestResponse<Result>;

/**
 * A hook for paginating through a PostgREST response using infinite queries.
 *
 * @param query - A PostgREST query builder.
 * @param config - A React Query configuration object.
 * @param config.pageSize - The number of items per page.
 * @returns An object containing the paginated data and various functions to manipulate the pagination state.
 */
function useInfiniteOffsetPaginationQuery<
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
  config?: Omit<
    UseInfiniteQueryOptions<
      PostgrestHasMorePaginationResponse<Result>,
      PostgrestError,
      InfiniteData<PostgrestHasMorePaginationResponse<Result>>,
      PostgrestHasMorePaginationResponse<Result>,
      QueryKey,
      unknown
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'getPreviousPageParam' | 'initialPageParam'
  > & { pageSize?: number },
): UseInfiniteOffsetPaginationQueryReturn<Result> {
  const pageSize = config?.pageSize ?? 20;
  
  // Generate query key
  const queryKey = query ? createInfiniteOffsetKeyGetter<Schema, Table, Result, RelationName, Relationships>(query, pageSize) : [];
  
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
    isError,
    error,
    isSuccess,
    isFetching,
    status,
    ...rest
  } = useInfiniteQuery<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError,
    InfiniteData<PostgrestHasMorePaginationResponse<Result>>,
    QueryKey
  >({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      if (!query) {
        throw new Error('Query is null');
      }
      
      try {
        // Direct query execution - most reliable method
        if (typeof pageParam === 'number') {
          const { data, error } = await query
            .limit(pageSize)
            .range(pageParam, pageParam + pageSize - 1);
            
          if (error) {
            throw error;
          }
          
          return {
            data: data || [],
            hasMore: (data || []).length === pageSize,
          };
        } else {
          // Use existing fetcher (fallback)
          const fetcher = createOffsetPaginationHasMoreFetcher<
            Schema,
            Table,
            Result,
            string
          >(
            query,
            (key: string) => {
              const decodedKey = decode(key);
              if (!decodedKey) {
                throw new Error('Not a valid key');
              }
              return {
                limit: decodedKey.limit || pageSize,
                offset: decodedKey.offset || 0,
              };
            },
            pageSize
          );
          
          if (!fetcher) {
            throw new Error('Failed to create fetcher');
          }
          
          const result = await fetcher(String(pageParam));
          return result;
        }
      } catch (err) {
        console.error('Error in queryFn:', err);
        throw err;
      }
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) {
        return undefined;
      }
      return pages.length * pageSize;
    },
    getPreviousPageParam: (_, allPages) => {
      if (allPages.length <= 1) {
        return undefined;
      }
      return (allPages.length - 2) * pageSize;
    },
    initialPageParam: 0,
    enabled: !!query,
    ...config,
  });

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Update parsedPages when data changes
  const parsedPages = data?.pages.map(page => page.data) || [];
  
  // Adjust current page index if it exceeds the valid range of parsed pages
  useEffect(() => {
    if (parsedPages.length > 0 && currentPageIndex >= parsedPages.length) {
      setCurrentPageIndex(parsedPages.length - 1);
    }
  }, [parsedPages.length, currentPageIndex]);
  
  const setPage = useCallback(
    (idx: number) => {
      if (idx >= 0) {
        // If we need to fetch more pages
        if (idx >= parsedPages.length && hasNextPage) {
          fetchNextPage().then(() => {
            setCurrentPageIndex(idx);
          });
        } else {
          setCurrentPageIndex(idx);
        }
      }
    },
    [parsedPages.length, hasNextPage, fetchNextPage]
  );

  const nextPageFn = useCallback(() => {
    if (currentPageIndex === parsedPages.length - 1) {
      if (hasNextPage) {
        fetchNextPage().then(() => {
          setCurrentPageIndex(prev => prev + 1);
        });
      }
    } else {
      setCurrentPageIndex(prev => prev + 1);
    }
  }, [currentPageIndex, parsedPages.length, hasNextPage, fetchNextPage]);

  const previousPageFn = useCallback(
    () => setCurrentPageIndex(current => Math.max(0, current - 1)),
    []
  );

  const result: UseInfiniteOffsetPaginationQueryReturn<Result> = {
    pages: parsedPages,
    currentPage: parsedPages.length > 0 ? parsedPages[currentPageIndex] || null : null,
    pageIndex: currentPageIndex,
    setPage,
    nextPage:
      !isFetching && (hasNextPage || currentPageIndex < parsedPages.length - 1)
        ? nextPageFn
        : undefined,
    previousPage: !isFetching && currentPageIndex > 0 ? previousPageFn : undefined,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
    isError,
    error,
    isSuccess,
    isFetching,
    status,
    ...rest,
  };

  return result;
}

export { useInfiniteOffsetPaginationQuery }; 