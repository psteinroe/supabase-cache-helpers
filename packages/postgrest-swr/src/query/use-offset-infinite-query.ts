import {
  createOffsetKeyGetter,
  decodeOffsetPaginationKey,
  infiniteMiddleware,
} from '../lib';
import { createOffsetPaginationFetcher } from '@supabase-cache-helpers/postgrest-core';
import { GenericSchema } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestError,
  PostgrestResponse,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import type { Middleware } from 'swr';
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteResponse,
} from 'swr/infinite';

/**
 * The return type of the `useInfiniteQuery` hook
 */
export type UseOffsetInfiniteQueryReturn<
  Result extends Record<string, unknown>,
> = SWRInfiniteResponse<
  Exclude<PostgrestResponse<Result>['data'], null>,
  PostgrestError
>;

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
} & SWRInfiniteConfiguration<
  Exclude<PostgrestResponse<Result>['data'], null>,
  PostgrestError
>;

/**
 * A hook to perform an infinite postgrest query
 *
 * @param opts - Options containing the query factory and configuration
 * @returns An object containing the query results and other SWR-related properties
 *
 * @example
 * ```tsx
 * const { data, size, setSize } = useOffsetInfiniteQuery({
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

  return useSWRInfinite<
    Exclude<PostgrestResponse<Result>['data'], null>,
    PostgrestError
  >(
    createOffsetKeyGetter(queryFactory, { pageSize, rpcArgs }),
    createOffsetPaginationFetcher(queryFactory, {
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
}

export { useOffsetInfiniteQuery };
