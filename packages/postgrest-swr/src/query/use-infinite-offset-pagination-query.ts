import { createOffsetKeyGetter, decode, infiniteMiddleware } from '../lib';
import {
  type PostgrestHasMorePaginationResponse,
  createOffsetPaginationHasMoreFetcher,
  decodeObject,
} from '@supabase-cache-helpers/postgrest-core';
import { GenericSchema } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { useCallback, useState } from 'react';
import type { Middleware } from 'swr';
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteResponse,
} from 'swr/infinite';

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
} & SWRInfiniteConfiguration<
  PostgrestHasMorePaginationResponse<Result>,
  PostgrestError
>;

/**
 * A hook for paginating through a PostgREST response.
 *
 * @param opts - Options containing the query factory and configuration
 * @returns An object containing the paginated data and various functions to manipulate the pagination state
 *
 * @example
 * ```tsx
 * const { currentPage, nextPage, previousPage } = useInfiniteOffsetPaginationQuery({
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
  const { query: queryFactory, pageSize, rpcArgs, ...config } = opts;
  const { data, setSize, size, isValidating, ...rest } = useSWRInfinite<
    PostgrestHasMorePaginationResponse<Result>,
    PostgrestError
  >(
    createOffsetKeyGetter(queryFactory, {
      pageSize: pageSize || 20,
      rpcArgs,
    }),
    createOffsetPaginationHasMoreFetcher<
      Options,
      Schema,
      Table,
      Result,
      string
    >(queryFactory, {
      decode: (key: string) => {
        const decodedKey = decode(key);
        if (!decodedKey) {
          throw new Error('Not a SWRPostgrest key');
        }

        if (rpcArgs) {
          if (decodedKey.bodyKey && decodedKey.bodyKey !== 'null') {
            const body = decodeObject(decodedKey.bodyKey);

            const limit = body[rpcArgs.limit];
            const offset = body[rpcArgs.offset];

            return {
              limit: typeof limit === 'number' ? limit : undefined,
              offset: typeof offset === 'number' ? offset : undefined,
            };
          } else {
            const sp = new URLSearchParams(decodedKey.queryKey);
            const limitValue = sp.get(rpcArgs.limit);
            const offsetValue = sp.get(rpcArgs.offset);
            return {
              limit: limitValue ? parseInt(limitValue, 10) : undefined,
              offset: offsetValue ? parseInt(offsetValue, 10) : undefined,
            };
          }
        }

        return {
          limit: decodedKey.limit,
          offset: decodedKey.offset,
        };
      },
      pageSize: pageSize || 20,
      rpcArgs,
    }),
    {
      ...config,
      use: [
        ...(config?.use || []),
        infiniteMiddleware as unknown as Middleware,
      ],
    },
  );

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const parsedData = (data || []).map((p) => p.data);
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
