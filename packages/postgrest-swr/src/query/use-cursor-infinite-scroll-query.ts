import { createCursorKeyGetter, decode, infiniteMiddleware } from '../lib';
import { parseOrderBy } from '../lib/parse-order-by';
import {
  type PostgrestPaginationCacheData,
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
  SWRInfiniteResponse<PostgrestPaginationCacheData<Result>, PostgrestError>,
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
  /** The column to order by */
  orderBy: ColumnName;
  /** If the `orderBy` column is not unique, you need to provide a second, unique column. This can be the primary key. */
  uqOrderBy?: ColumnName;
  /** If set, will *not* apply filters to the query but pass them cursor values to the body of the rpc function. Requires the query to be a `.rpc()` call. */
  rpcArgs?: { limit: string; orderBy: string; uqOrderBy?: string };
};

/**
 * Options for the useCursorInfiniteScrollQuery hook
 */
export type UseCursorInfiniteScrollQueryOpts<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
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
} & CursorConfig<Table, ColumnName> &
  SWRInfiniteConfiguration<PostgrestPaginationResponse<Result>, PostgrestError>;

/**
 * A hook that provides infinite scroll capabilities to PostgREST queries using SWR.
 *
 * @param opts - Options containing the query factory and configuration
 * @returns The infinite scroll query result
 *
 * @example
 * ```tsx
 * const { data, loadMore } = useCursorInfiniteScrollQuery({
 *   query: () => client.from('contact').select('id,name').order('created_at'),
 *   orderBy: 'created_at'
 * });
 * ```
 */
function useCursorInfiniteScrollQuery<
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
  RelationName = unknown,
  Relationships = unknown,
>(
  opts: UseCursorInfiniteScrollQueryOpts<
    Options,
    Schema,
    Table,
    Result,
    ColumnName,
    RelationName,
    Relationships
  >,
): UseCursorInfiniteScrollQueryReturn<Result> {
  const { query: queryFactory, orderBy, uqOrderBy, rpcArgs, ...config } = opts;
  const { data, setSize, size, isValidating, ...rest } = useSWRInfinite<
    PostgrestPaginationResponse<Result>,
    PostgrestError
  >(
    createCursorKeyGetter(queryFactory, { orderBy, uqOrderBy, rpcArgs }),
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
          if (rpcArgs) {
            if (decodedKey.bodyKey && decodedKey.bodyKey !== 'null') {
              const body = decodeObject(decodedKey.bodyKey);

              const orderByValue = body[rpcArgs.orderBy];
              const uqOrderByValue = rpcArgs.uqOrderBy
                ? body[rpcArgs.uqOrderBy]
                : undefined;

              return {
                orderBy:
                  typeof orderByValue === 'string' ? orderByValue : undefined,
                uqOrderBy:
                  typeof uqOrderByValue === 'string'
                    ? uqOrderByValue
                    : undefined,
              };
            } else {
              const sp = new URLSearchParams(decodedKey.queryKey);
              const orderByValue = sp.get(rpcArgs.orderBy);
              const uqOrderByValue = rpcArgs.uqOrderBy
                ? sp.get(rpcArgs.uqOrderBy)
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
            { orderByPath: orderBy, uqOrderByPath: uqOrderBy },
          );

          const searchParams = new URLSearchParams(decodedKey.queryKey);

          if (uqOrderBy) {
            // the filter is an "or" operator
            const possibleFilters = searchParams.getAll('or');
            // find "ours"
            const filter = possibleFilters.find(
              (f) => f.includes(`${orderBy}.`) && f.includes(`${uqOrderBy}.`),
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
            const filters = searchParams.getAll(orderBy);
            // find "ours"
            const filter = filters.find((f) =>
              f.startsWith(`${orderBy}.${mainOrderBy.ascending ? 'gt' : 'lt'}`),
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
        orderBy,
        uqOrderBy,
        rpcArgs,
      },
    ),
    {
      ...config,
      use: [
        ...(config?.use || []),
        infiniteMiddleware as unknown as Middleware,
      ],
    },
  );

  const { flatData, hasLoadMore } = useMemo(() => {
    if (!queryFactory) {
      return { flatData: undefined, hasLoadMore: false };
    }

    const query = queryFactory();

    const flatData = (data || []).flat();

    let pageSize;
    if (rpcArgs) {
      if (query['method'] === 'GET') {
        pageSize = query['url'].searchParams.get(rpcArgs.limit);
      } else {
        pageSize = isPlainObject(query['body'])
          ? query['body'][rpcArgs.limit]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, rpcArgs, queryFactory]);

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
