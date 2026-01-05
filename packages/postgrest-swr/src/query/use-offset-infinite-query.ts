import { createOffsetKeyGetter, decode, infiniteMiddleware } from '../lib';
import {
  createOffsetPaginationFetcher,
  decodeObject,
} from '@supabase-cache-helpers/postgrest-core';
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
 * @deprecated Use UseOffsetInfiniteQueryReturn instead.
 */
export type UseInfiniteQueryReturn<Result extends Record<string, unknown>> =
  UseOffsetInfiniteQueryReturn<Result>;

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
  const { query: queryFactory, pageSize, rpcArgs, ...config } = opts;
  return useSWRInfinite<
    Exclude<PostgrestResponse<Result>['data'], null>,
    PostgrestError
  >(
    createOffsetKeyGetter(queryFactory, {
      pageSize: pageSize ?? 20,
      rpcArgs,
    }),
    createOffsetPaginationFetcher(queryFactory, {
      decode: (key: string) => {
        const decodedKey = decode(key);
        if (!decodedKey) {
          throw new Error('Not a SWRPostgrest key');
        }

        // extract last value from body key instead
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
      pageSize: pageSize ?? 20,
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
