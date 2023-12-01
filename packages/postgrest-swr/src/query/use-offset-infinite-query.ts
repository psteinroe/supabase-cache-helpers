import {
  PostgrestError,
  PostgrestResponse,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/module/types';
import { createOffsetPaginationFetcher } from '@supabase-cache-helpers/postgrest-core';
import { Middleware } from 'swr';
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from 'swr/infinite';

import { createOffsetKeyGetter, infiniteMiddleware, decode } from '../lib';

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
  query: PostgrestTransformBuilder<
    Schema,
    Table,
    Result[],
    RelationName,
    Relationships
  > | null,
  config?: SWRInfiniteConfiguration<
    Exclude<PostgrestResponse<Result>['data'], null>,
    PostgrestError
  > & { pageSize?: number },
): UseOffsetInfiniteQueryReturn<Result> {
  return useSWRInfinite<
    Exclude<PostgrestResponse<Result>['data'], null>,
    PostgrestError
  >(
    createOffsetKeyGetter(query, config?.pageSize ?? 20),
    createOffsetPaginationFetcher(
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
      config?.pageSize ?? 20,
    ),
    {
      ...config,
      use: [
        ...(config?.use ?? []),
        infiniteMiddleware as unknown as Middleware,
      ],
    },
  );
}

/**
 * @deprecated Use useOffsetInfiniteQuery instead.
 */
const useInfiniteQuery = useOffsetInfiniteQuery;

export { useInfiniteQuery, useOffsetInfiniteQuery };
