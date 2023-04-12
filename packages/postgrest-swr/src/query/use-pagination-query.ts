import { createPaginationHasMoreFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import { PostgrestHasMorePaginationResponse } from '@supabase-cache-helpers/postgrest-shared';
import {
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/module/types';
import { useMemo, useState } from 'react';
import { Middleware } from 'swr';
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from 'swr/infinite';

import { createKeyGetter, decode, infiniteMiddleware } from '../lib';

export type SWRInfinitePaginationPostgrestResponse<Result> = Omit<
  SWRInfiniteResponse<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError
  >,
  'data' | 'size' | 'setSize'
> & {
  pages: SWRInfiniteResponse<Result[], PostgrestError>['data'];
  currentPage: null | Result[];
  pageIndex: number;
  setPage: (idx: number) => void;
  nextPage: null | (() => void);
  previousPage: null | (() => void);
};

/**
 * The return value of the `usePaginationQuery` hook.
 */
export type UsePaginationQueryReturn<Result extends Record<string, unknown>> =
  SWRInfinitePaginationPostgrestResponse<Result>;

/**
 * A hook for paginating through a PostgREST response.
 *
 * @param query - A PostgREST query builder.
 * @param config - A SWR configuration object.
 * @param config.pageSize - The number of items per page.
 * @returns An object containing the paginated data and various functions to manipulate the pagination state.
 */
function usePaginationQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>
>(
  query: PostgrestTransformBuilder<Schema, Table, Result[]> | null,
  config?: SWRInfiniteConfiguration & { pageSize?: number }
): UsePaginationQueryReturn<Result> {
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

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { data: parsedData, hasMore } = useMemo(() => {
    return {
      data: (data ?? []).map((p) => p.data),
      hasMore:
        Array.isArray(data) && data.length > 0 && data[data.length - 1].hasMore,
    };
  }, [data]);

  return {
    pages: parsedData,
    currentPage: parsedData ? parsedData[currentPageIndex] ?? [] : [],
    pageIndex: currentPageIndex,
    setPage: (idx) => setCurrentPageIndex(idx),
    nextPage:
      hasMore || currentPageIndex < size - 1
        ? () => {
            if (currentPageIndex === size - 1) {
              setSize((size) => size + 1);
            }
            setCurrentPageIndex((page) => page + 1);
          }
        : null,
    previousPage:
      currentPageIndex > 0
        ? () => setCurrentPageIndex((current) => current - 1)
        : null,
    ...rest,
  };
}

export { usePaginationQuery };
