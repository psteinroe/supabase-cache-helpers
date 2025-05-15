import {
  type PostgrestHasMorePaginationResponse,
  createOffsetPaginationHasMoreFetcher,
  decodeObject,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';
import { useCallback, useState } from 'react';
import type { Middleware } from 'swr';
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteResponse,
} from 'swr/infinite';

import { createOffsetKeyGetter, decode, infiniteMiddleware } from '../lib';

export type SWRInfiniteOffsetPaginationPostgrestResponse<Result> = Omit<
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
 * @deprecated Use SWROffsetInfinitePaginationPostgrestResponse instead.
 */
export type SWRInfinitePaginationPostgrestResponse<Result> =
  SWRInfiniteOffsetPaginationPostgrestResponse<Result>;

/**
 * The return value of the `usePaginationQuery` hook.
 */
export type UseInfiniteOffsetPaginationQueryReturn<
  Result extends Record<string, unknown>,
> = SWRInfiniteOffsetPaginationPostgrestResponse<Result>;

/**
 * @deprecated Use SWROffsetInfinitePaginationPostgrestResponse instead.
 */
export type UsePaginationQueryReturn<Result extends Record<string, unknown>> =
  UseInfiniteOffsetPaginationQueryReturn<Result>;

/**
 * A hook for paginating through a PostgREST response.
 *
 * @param query - A PostgREST query builder.
 * @param config - A SWR configuration object.
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
  queryFactory:
    | (() => PostgrestTransformBuilder<
        Schema,
        Table,
        Result[],
        RelationName,
        Relationships
      >)
    | null,
  config?: SWRInfiniteConfiguration<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError
  > & {
    pageSize?: number;
    applyToBody?: { limit: string; offset: string };
  },
): UseInfiniteOffsetPaginationQueryReturn<Result> {
  const { data, setSize, size, isValidating, ...rest } = useSWRInfinite<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError
  >(
    createOffsetKeyGetter(queryFactory, {
      pageSize: config?.pageSize ?? 20,
      applyToBody: config?.applyToBody,
    }),
    createOffsetPaginationHasMoreFetcher<Schema, Table, Result, string>(
      queryFactory,
      {
        decode: (key: string) => {
          const decodedKey = decode(key);
          if (!decodedKey) {
            throw new Error('Not a SWRPostgrest key');
          }

          // extract last value from body key instead
          if (decodedKey.bodyKey && config?.applyToBody) {
            const body = decodeObject(decodedKey.bodyKey);

            const limit = body[config.applyToBody.limit];
            const offset = body[config.applyToBody.offset];

            return {
              limit: typeof limit === 'number' ? limit : undefined,
              offset: typeof offset === 'number' ? offset : undefined,
            };
          }

          return {
            limit: decodedKey.limit,
            offset: decodedKey.offset,
          };
        },
        pageSize: config?.pageSize ?? 20,
        applyToBody: config?.applyToBody,
      },
    ),
    {
      ...config,
      use: [
        ...(config?.use ?? []),
        infiniteMiddleware as unknown as Middleware,
      ],
    },
  );

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const parsedData = (data ?? []).map((p) => p.data);
  const hasMore =
    Array.isArray(data) && data.length > 0 && data[data.length - 1].hasMore;

  const setPage = useCallback(
    (idx: number) => {
      if (idx > size - 1) {
        setSize(idx + 1);
      }
      setCurrentPageIndex(idx);
    },
    [size, setSize, setCurrentPageIndex],
  );

  const nextPageFn = useCallback(() => {
    if (currentPageIndex === size - 1) {
      setSize((size) => size + 1);
    }
    setCurrentPageIndex((page) => page + 1);
  }, [currentPageIndex, size, setSize, setCurrentPageIndex]);

  const previousPageFn = useCallback(
    () => setCurrentPageIndex((current) => current - 1),
    [setCurrentPageIndex],
  );

  return {
    pages: parsedData,
    currentPage: parsedData ? (parsedData[currentPageIndex] ?? []) : [],
    pageIndex: currentPageIndex,
    setPage,
    nextPage:
      !isValidating && (hasMore || currentPageIndex < size - 1)
        ? nextPageFn
        : null,
    previousPage: !isValidating && currentPageIndex > 0 ? previousPageFn : null,
    isValidating,
    ...rest,
  };
}

export { useInfiniteOffsetPaginationQuery };
