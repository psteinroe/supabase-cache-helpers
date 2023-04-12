import { createPaginationFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import {
  PostgrestError,
  PostgrestResponse,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/module/types';
import { Middleware } from 'swr';
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from 'swr/infinite';

import { createKeyGetter, infiniteMiddleware, decode } from '../lib';

/**
 * The return type of the `useInfiniteQuery` hook
 */
export type UseInfiniteQueryReturn<Result extends Record<string, unknown>> =
  SWRInfiniteResponse<
    Exclude<PostgrestResponse<Result>['data'], null>,
    PostgrestError
  >;

/**
 * A hook to perform an infinite postgrest query
 * @param query The postgrest query builder
 * @param config Optional SWRInfiniteConfiguration options to configure the hook
 * @returns An object containing the query results and other SWR-related properties
 */
function useInfiniteQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>
>(
  query: PostgrestTransformBuilder<Schema, Table, Result[]> | null,
  config?: SWRInfiniteConfiguration & { pageSize?: number }
): UseInfiniteQueryReturn<Result> {
  return useSWRInfinite<
    Exclude<PostgrestResponse<Result>['data'], null>,
    PostgrestError
  >(
    createKeyGetter(query, config?.pageSize ?? 20),
    createPaginationFetcher(
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
}

export { useInfiniteQuery };
