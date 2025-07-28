import {
  createOffsetPaginationFetcher,
  decodeObject,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestResponse,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';
import type { Middleware } from 'swr';
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteResponse,
} from 'swr/infinite';

import { createOffsetKeyGetter, decode, infiniteMiddleware } from '../lib';

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
 * A hook to perform an infinite postgrest query
 * @param query The postgrest query builder
 * @param config Optional SWRInfiniteConfiguration options to configure the hook
 * @returns An object containing the query results and other SWR-related properties
 */
function useOffsetInfiniteQuery<
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
    Exclude<PostgrestResponse<Result>['data'], null>,
    PostgrestError
  > & {
    pageSize?: number;
    rpcArgs?: { limit: string; offset: string };
  },
): UseOffsetInfiniteQueryReturn<Result> {
  return useSWRInfinite<
    Exclude<PostgrestResponse<Result>['data'], null>,
    PostgrestError
  >(
    createOffsetKeyGetter(queryFactory, {
      pageSize: config?.pageSize ?? 20,
      rpcArgs: config?.rpcArgs,
    }),
    createOffsetPaginationFetcher(queryFactory, {
      decode: (key: string) => {
        const decodedKey = decode(key);
        if (!decodedKey) {
          throw new Error('Not a SWRPostgrest key');
        }

        // extract last value from body key instead
        if (config?.rpcArgs) {
          if (decodedKey.bodyKey && decodedKey.bodyKey !== 'null') {
            const body = decodeObject(decodedKey.bodyKey);

            const limit = body[config.rpcArgs.limit];
            const offset = body[config.rpcArgs.offset];

            return {
              limit: typeof limit === 'number' ? limit : undefined,
              offset: typeof offset === 'number' ? offset : undefined,
            };
          } else {
            const sp = new URLSearchParams(decodedKey.queryKey);
            const limitValue = sp.get(config.rpcArgs.limit);
            const offsetValue = sp.get(config.rpcArgs.offset);
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
      pageSize: config?.pageSize ?? 20,
      rpcArgs: config?.rpcArgs,
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
