import { encode } from '../lib';
import {
  fetchCount,
  fetchPaginatedData,
  isPostgrestBuilder,
} from '@supabase-cache-helpers/postgrest-core';
import type { GenericSchema } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { useCallback, useMemo, useState } from 'react';
import useSWR, { type SWRConfiguration } from 'swr';

/**
 * The return type of the `usePaginatedQuery` hook
 */
export type UsePaginatedQueryReturn<Result extends Record<string, unknown>> = {
  /** The current page data */
  data: Result[] | undefined;
  /** Total count of items (from count query) */
  count: number | null;
  /** Current page index (0-based) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total number of pages (null if count unavailable) */
  totalPages: number | null;
  /** Set the current page (clamps to valid range) */
  setPage: (page: number) => void;
  /** Go to next page (null if not available) */
  nextPage: (() => void) | null;
  /** Go to previous page (null if not available) */
  previousPage: (() => void) | null;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  /** Whether any query is loading */
  isLoading: boolean;
  /** Whether any query is validating */
  isValidating: boolean;
  /** Combined error from data or count query */
  error: PostgrestError | null;
  /** Whether the count query is loading */
  isCountLoading: boolean;
  /** Whether the data query is loading */
  isDataLoading: boolean;
};

/**
 * Options for the usePaginatedQuery hook
 */
export type UsePaginatedQueryOpts<
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
  /** Controlled page index (optional - if provided, component controls page state) */
  page?: number;
  /** Initial page index for uncontrolled mode (default: 0) */
  defaultPage?: number;
  /** Count type for the count query (default: 'exact') */
  countType?: 'exact' | 'planned' | 'estimated';
  /** RPC argument names for limit and offset */
  rpcArgs?: { limit: string; offset: string };
} & SWRConfiguration<Result[], PostgrestError>;

/**
 * A hook for traditional pagination with total page count.
 * Runs count and data queries in parallel for optimal performance.
 *
 * @param opts - Options containing the query factory and configuration
 * @returns An object containing the paginated data, total pages, and navigation functions
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   page,
 *   totalPages,
 *   setPage,
 *   nextPage,
 *   previousPage,
 * } = usePaginatedQuery({
 *   query: () => client.from('contact').select('id,name'),
 *   pageSize: 10
 * });
 * ```
 */
function usePaginatedQuery<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
>(
  opts: UsePaginatedQueryOpts<
    Options,
    Schema,
    Table,
    Result,
    RelationName,
    Relationships
  >,
): UsePaginatedQueryReturn<Result> {
  const {
    query: queryFactory,
    pageSize = 20,
    page: controlledPage,
    defaultPage = 0,
    countType = 'exact',
    rpcArgs,
    ...swrConfig
  } = opts;

  // Internal page state for uncontrolled mode
  const [internalPage, setInternalPage] = useState(defaultPage);

  // Use controlled page if provided, otherwise use internal state
  const currentPage = controlledPage ?? internalPage;

  // Create query keys
  const baseQueryKey = useMemo(() => {
    if (!queryFactory) return null;
    const query = queryFactory();
    if (!isPostgrestBuilder<Result[]>(query)) return null;
    return encode<Result[]>(query, false);
  }, [queryFactory]);

  const offset = currentPage * pageSize;

  // Count query key
  const countQueryKey = baseQueryKey
    ? `${baseQueryKey}|count|${countType}`
    : null;

  // Data query key
  const dataQueryKey = baseQueryKey
    ? `${baseQueryKey}|page|${currentPage}|${pageSize}`
    : null;

  // Count query
  const countResult = useSWR<number | null, PostgrestError>(
    countQueryKey,
    async (): Promise<number | null> => {
      if (!queryFactory) return null;
      return fetchCount(queryFactory(), { countType });
    },
    {
      revalidateOnFocus: swrConfig.revalidateOnFocus ?? false,
    },
  );

  // Data query
  const dataResult = useSWR<Result[], PostgrestError>(
    dataQueryKey,
    async (): Promise<Result[]> => {
      if (!queryFactory) return [];
      return fetchPaginatedData(queryFactory(), { pageSize, offset, rpcArgs });
    },
    {
      ...swrConfig,
      revalidateOnFocus: swrConfig.revalidateOnFocus ?? false,
    },
  );

  const count = countResult.data ?? null;
  const data = dataResult.data;

  const totalPages = useMemo(() => {
    if (count === null) return null;
    return Math.ceil(count / pageSize);
  }, [count, pageSize]);

  // Clamp page to valid range
  const setPage = useCallback(
    (newPage: number) => {
      let clampedPage = Math.max(0, newPage);
      if (totalPages !== null) {
        clampedPage = Math.min(clampedPage, totalPages - 1);
      }
      setInternalPage(clampedPage);
    },
    [totalPages],
  );

  const hasNextPage = totalPages !== null ? currentPage < totalPages - 1 : true;
  const hasPreviousPage = currentPage > 0;

  const isLoading = countResult.isLoading || dataResult.isLoading;
  const isValidating = countResult.isValidating || dataResult.isValidating;

  const nextPageFn = useCallback(() => {
    setPage(currentPage + 1);
  }, [currentPage, setPage]);

  const previousPageFn = useCallback(() => {
    setPage(currentPage - 1);
  }, [currentPage, setPage]);

  return {
    data,
    count,
    page: currentPage,
    pageSize,
    totalPages,
    setPage,
    nextPage: hasNextPage && !isValidating ? nextPageFn : null,
    previousPage: hasPreviousPage && !isValidating ? previousPageFn : null,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isValidating,
    error: countResult.error ?? dataResult.error ?? null,
    isCountLoading: countResult.isLoading,
    isDataLoading: dataResult.isLoading,
  };
}

export { usePaginatedQuery };
