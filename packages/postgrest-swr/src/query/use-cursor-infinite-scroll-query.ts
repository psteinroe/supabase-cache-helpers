import { createCursorKeyGetter, decode, infiniteMiddleware } from '../lib';
import { parseOrderBy } from '../lib/parse-order-by';
import {
  type PostgrestPaginationResponse,
  createCursorPaginationFetcher,
  decodeObject,
  isPlainObject,
} from '@supabase-cache-helpers/postgrest-core';
import { GenericSchema } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { useCallback, useMemo } from 'react';
import type { Middleware } from 'swr';
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteResponse,
} from 'swr/infinite';

export type SWRCursorInfiniteScrollPostgrestResponse<Result> = Omit<
  SWRInfiniteResponse<PostgrestPaginationResponse<Result>, PostgrestError>,
  'data'
> & {
  loadMore: null | (() => void);
  data: Result[] | undefined;
};

/**
 * The return value of useInfiniteScrollQuery hook.
 */
export type UseCursorInfiniteScrollQueryReturn<
  Result extends Record<string, unknown>,
> = Omit<
  SWRInfiniteResponse<PostgrestPaginationResponse<Result>, PostgrestError>,
  'data'
> & {
  loadMore: null | (() => void);
  data: Result[] | undefined;
};

export type CursorConfig<
  Table extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
> = {
  // The column to order by
  orderBy: ColumnName;
  // If the `orderBy` column is not unique, you need to provide a second, unique column. This can be the primary key.
  uqOrderBy?: ColumnName;
  // if set, will *not* apply filters to the query but pass them cursor values to the body of the rpc function. Requires the query to be a `.rpc()` call.
  rpcArgs?: { limit: string; orderBy: string; uqOrderBy?: string };
};

/**
 * A hook that provides infinite scroll capabilities to PostgREST queries using SWR.
 *
 * @param {PostgrestTransformBuilder<Schema, Table, Result[]> | null} query - The PostgREST query.
 * @param {SWRInfiniteConfiguration & { pageSize?: number }} [config] - The SWRInfinite configuration.
 * @returns {UseInfiniteScrollQueryReturn<Result>} - The infinite scroll query result.
 */
function useCursorInfiniteScrollQuery<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
  RelationName,
  Relationships = unknown,
>(
  queryFactory:
    | (() => PostgrestTransformBuilder<
        Options,
        Schema,
        Table,
        Result[],
        RelationName,
        Relationships
      >)
    | null,
  config: SWRInfiniteConfiguration<
    PostgrestPaginationResponse<Result>,
    PostgrestError
  > &
    CursorConfig<Table, ColumnName>,
): UseCursorInfiniteScrollQueryReturn<Result> {
  const { data, setSize, size, isValidating, ...rest } = useSWRInfinite<
    PostgrestPaginationResponse<Result>,
    PostgrestError
  >(
    createCursorKeyGetter(queryFactory, config),
    createCursorPaginationFetcher<Options, Schema, Table, Result, string>(
      queryFactory,
      {
        decode: (key: string) => {
          if (!queryFactory) {
            throw new Error('No query provided');
          }
          const decodedKey = decode(key);
          if (!decodedKey) {
            throw new Error('Not a SWRPostgrest key');
          }

          // extract last value from body key instead
          if (config.rpcArgs) {
            if (decodedKey.bodyKey && decodedKey.bodyKey !== 'null') {
              const body = decodeObject(decodedKey.bodyKey);

              const orderBy = body[config.rpcArgs.orderBy];
              const uqOrderBy = config.rpcArgs.uqOrderBy
                ? body[config.rpcArgs.uqOrderBy]
                : undefined;

              return {
                orderBy: typeof orderBy === 'string' ? orderBy : undefined,
                uqOrderBy:
                  typeof uqOrderBy === 'string' ? uqOrderBy : undefined,
              };
            } else {
              const sp = new URLSearchParams(decodedKey.queryKey);
              const orderByValue = sp.get(config.rpcArgs.orderBy);
              const uqOrderByValue = config.rpcArgs.uqOrderBy
                ? sp.get(config.rpcArgs.uqOrderBy)
                : undefined;
              return {
                orderBy: orderByValue || undefined,
                uqOrderBy: uqOrderByValue || undefined,
              };
            }
          }

          const query = queryFactory();

          const { orderBy: mainOrderBy } = parseOrderBy(
            query['url'].searchParams,
            { orderByPath: config.orderBy, uqOrderByPath: config.uqOrderBy },
          );

          const searchParams = new URLSearchParams(decodedKey.queryKey);

          if (config.uqOrderBy) {
            // the filter is an "or" operator
            const possibleFilters = searchParams.getAll('or');
            // find "ours"
            const filter = possibleFilters.find(
              (f) =>
                f.includes(`${config.orderBy}.`) &&
                f.includes(`${config.uqOrderBy}.`),
            );
            if (!filter) {
              return {};
            }

            // extract values
            // we know the format so this is safe
            const bracketsPart = filter
              .split('and')
              .pop()!
              .match(/\((.*)\)\)/)![1]!
              .replace(/\s+/g, '');
            const filterParts = bracketsPart.split(',');
            const cursorValue = filterParts[0].split('.').pop()!;
            const uqCursorValue = filterParts[1].split('.').pop()!;

            return {
              orderBy: cursorValue,
              uqOrderBy: uqCursorValue,
            };
          } else {
            const filters = searchParams.getAll(config.orderBy);
            // find "ours"
            const filter = filters.find((f) =>
              f.startsWith(
                `${config.orderBy}.${mainOrderBy.ascending ? 'gt' : 'lt'}`,
              ),
            );

            if (!filter) {
              return {};
            }

            // extract values
            // we know the format so this is safe
            const cursorValue = filter.split('.').pop()!;

            return {
              orderBy: cursorValue,
            };
          }
        },
        orderBy: config.orderBy,
        uqOrderBy: config.uqOrderBy,
        rpcArgs: config.rpcArgs,
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

  const { flatData, hasLoadMore } = useMemo(() => {
    if (!queryFactory) {
      return { flatData: undefined, hasLoadMore: false };
    }

    const query = queryFactory();

    const flatData = (data ?? []).flat();

    let pageSize;
    if (config.rpcArgs) {
      if (query['method'] === 'GET') {
        pageSize = query['url'].searchParams.get(config.rpcArgs.limit);
      } else {
        pageSize = isPlainObject(query['body'])
          ? query['body'][config.rpcArgs.limit]
          : null;
      }
    } else {
      pageSize = query ? query['url'].searchParams.get('limit') : null;
    }

    if (!pageSize) {
      return { flatData: undefined, hasLoadMore: false };
    }

    let hasLoadMore =
      !data ||
      (pageSize ? data[data.length - 1].length === Number(pageSize) : true);

    return {
      flatData,
      hasLoadMore,
    };
  }, [data, config]);

  const loadMoreFn = useCallback(() => setSize(size + 1), [size, setSize]);

  return {
    data: flatData,
    size,
    setSize,
    loadMore: hasLoadMore && !isValidating ? loadMoreFn : null,
    isValidating,
    ...rest,
  };
}

export { useCursorInfiniteScrollQuery };
