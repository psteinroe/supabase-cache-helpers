import {
  createOffsetKeyGetter,
  decodeOffsetPaginationKey,
  infiniteMiddleware,
} from '../lib';
import {
  type PostgrestHasMorePaginationResponse,
  createOffsetPaginationHasMoreFetcher,
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
  currentPage: Result[];
  pageIndex: number;
  setPage: (idx: number) => void;
  nextPage: (() => void) | null;
  previousPage: (() => void) | null;
};

/**
 * The return value of the `usePaginationQuery` hook.
 */
export type UseInfiniteOffsetPaginationQueryReturn<
  Result extends Record<string, unknown>,
> = SWRInfiniteOffsetPaginationPostgrestResponse<Result>;

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
    [size, setSize],
  );

  const nextPageFn = useCallback(() => {
    if (currentPageIndex === size - 1) {
      setSize((size) => size + 1);
    }
    setCurrentPageIndex((page) => page + 1);
  }, [currentPageIndex, size, setSize]);

  const previousPageFn = useCallback(
    () => setCurrentPageIndex((current) => current - 1),
    [],
  );

  return {
    pages: parsedData,
    currentPage: parsedData[currentPageIndex] ?? [],
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
