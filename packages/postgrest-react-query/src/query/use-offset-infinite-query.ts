import {
  createInfiniteQueryKey,
  createOffsetPaginationQueryFn,
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

/**
 * The return type of the `useOffsetInfiniteQuery` hook
 */
export type UseOffsetInfiniteQueryReturn<
  Result extends Record<string, unknown>,
> = UseInfiniteQueryResult<InfiniteData<Result[], number>, PostgrestError>;

/**
 * Options for the useOffsetInfiniteQuery hook
 */
export type UseOffsetInfiniteQueryOpts<
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
    Result[],
    PostgrestError,
    InfiniteData<Result[], number>,
    Result[],
    string[],
    number
  >,
  'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
>;

/**
 * A hook to perform an infinite postgrest query using offset-based pagination.
 *
 * @param opts - Options containing the query factory and configuration
 * @returns An object containing the query results and React Query-related properties
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage } = useOffsetInfiniteQuery({
 *   query: () => client.from('contact').select('id,name'),
 *   pageSize: 10
 * });
 * ```
 */
function useOffsetInfiniteQuery<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
>(
  opts: UseOffsetInfiniteQueryOpts<
    Options,
    Schema,
    Table,
    Result,
    RelationName,
    Relationships
  >,
): UseOffsetInfiniteQueryReturn<Result> {
  const { query: queryFactory, pageSize = 20, rpcArgs, ...config } = opts;

  const queryKey = queryFactory
    ? createInfiniteQueryKey<Result[]>(queryFactory())
    : null;

  return useInfiniteQuery<
    Result[],
    PostgrestError,
    InfiniteData<Result[], number>,
    string[],
    number
  >({
    queryKey: queryKey ?? ['postgrest', 'disabled'],
    queryFn: queryFactory
      ? createOffsetPaginationQueryFn<
          Options,
          Schema,
          Table,
          Result,
          RelationName,
          Relationships
        >(queryFactory, { pageSize, rpcArgs })
      : () => Promise.resolve([]),
    enabled: !!queryFactory,
    initialPageParam: 0,
    getNextPageParam: getNextOffsetPageParam(pageSize),
    ...config,
  });
}

export { useOffsetInfiniteQuery };
