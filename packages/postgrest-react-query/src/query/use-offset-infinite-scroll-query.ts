import {
  type PostgrestHasMorePaginationResponse,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';
import { useCallback } from 'react';
import {
  useInfiniteQuery,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';

import { createInfiniteOffsetKeyGetter } from '../lib/key';

/**
 * The return value of useOffsetInfiniteScrollQuery hook.
 */
export type UseOffsetInfiniteScrollQueryReturn<
  Result extends Record<string, unknown>,
> = Omit<
  UseInfiniteQueryResult<
    InfiniteData<PostgrestHasMorePaginationResponse<Result>>,
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
 * A hook that provides infinite scroll capabilities to PostgREST queries using React Query.
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
  config?: Omit<
    UseInfiniteQueryOptions<
      PostgrestHasMorePaginationResponse<Result>,
      PostgrestError,
      InfiniteData<PostgrestHasMorePaginationResponse<Result>>,
      PostgrestHasMorePaginationResponse<Result>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'getPreviousPageParam' | 'initialPageParam'
  > & { 
    pageSize?: number;
    fallbackData?: {
      pages: PostgrestHasMorePaginationResponse<Result>[];
      pageParams: number[];
    };
  },
): UseOffsetInfiniteScrollQueryReturn<Result> {
  const pageSize = config?.pageSize ?? 20;
  
  // Generate query key
  const queryKey = query ? createInfiniteOffsetKeyGetter<Schema, Table, Result, RelationName, Relationships>(query, pageSize) : [];
  
  const result = useInfiniteQuery<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError,
    InfiniteData<PostgrestHasMorePaginationResponse<Result>>,
    QueryKey,
    number
  >({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      if (!query) {
        throw new Error('Query is null');
      }
      
      try {
        // Direct query execution
        const { data, error } = await query
          .limit(pageSize + 1)  // +1 to check if there are more items
          .range(pageParam, pageParam + pageSize);
          
        if (error) {
          throw error;
        }
        
        let hasMore = false;
        const resultData = [...(data || [])];
        
        if (resultData.length > pageSize) {
          hasMore = true;
          resultData.pop(); // Remove the extra item
        }
        
        return {
          data: resultData as Result[],
          hasMore,
        };
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
    initialPageParam: 0,
    enabled: !!query,
    initialData: config?.fallbackData,
    ...config,
  });

  // Create loadMore function
  const hasMore = result.data?.pages[result.data.pages.length - 1]?.hasMore;
  const loadMoreFn = useCallback(() => {
    if (result.hasNextPage && !result.isFetchingNextPage) {
      result.fetchNextPage();
    }
  }, [result.fetchNextPage, result.hasNextPage, result.isFetchingNextPage]);

  return {
    ...result,
    data: result.data?.pages.flatMap(page => page.data),
    loadMore: hasMore ? loadMoreFn : null,
  };
}

/**
 * @deprecated Use useOffsetInfiniteScrollQuery instead.
 */
const useInfiniteScrollQuery = useOffsetInfiniteScrollQuery;

export { useInfiniteScrollQuery, useOffsetInfiniteScrollQuery };
