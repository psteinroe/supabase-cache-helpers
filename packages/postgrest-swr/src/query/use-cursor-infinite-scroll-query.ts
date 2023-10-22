import {
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/module/types';
import {
  createCursorPaginationFetcher,
  get,
  parseValue,
  PostgrestPaginationCacheData,
  PostgrestPaginationResponse,
} from '@supabase-cache-helpers/postgrest-core';
import { useCallback, useMemo } from 'react';
import { Middleware } from 'swr';
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from 'swr/infinite';

import { infiniteMiddleware, decode, createCursorKeyGetter } from '../lib';

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

export type CursorSettings<
  Table extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
> = {
  path: ColumnName;
  until?: Table[ColumnName];
};

/**
 * A hook that provides infinite scroll capabilities to PostgREST queries using SWR.
 *
 * @param {PostgrestTransformBuilder<Schema, Table, Result[]> | null} query - The PostgREST query.
 * @param {SWRInfiniteConfiguration & { pageSize?: number }} [config] - The SWRInfinite configuration.
 * @returns {UseInfiniteScrollQueryReturn<Result>} - The infinite scroll query result.
 */
function useCursorInfiniteScrollQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Schema,
    Table,
    Result[],
    Relationships
  > | null,
  cursor: CursorSettings<Table, ColumnName>,
  config?: SWRInfiniteConfiguration<
    PostgrestPaginationResponse<Result>,
    PostgrestError
  >,
): UseCursorInfiniteScrollQueryReturn<Result> {
  const { data, setSize, size, isValidating, ...rest } = useSWRInfinite<
    PostgrestPaginationResponse<Result>,
    PostgrestError
  >(
    createCursorKeyGetter(query, cursor),
    createCursorPaginationFetcher<Schema, Table, Result, string>(
      query,
      (key: string) => {
        if (!query) {
          throw new Error('No query provided');
        }
        const decodedKey = decode(key);
        if (!decodedKey) {
          throw new Error('Not a SWRPostgrest key');
        }

        // ordering key is foreignTable.order
        const pathSplit = cursor.path.split('.');
        let foreignTablePath = null;
        if (pathSplit.length > 1) {
          pathSplit.pop();
          foreignTablePath = pathSplit.join('.');
        }

        const orderingKey = `${
          foreignTablePath ? `${foreignTablePath}.` : ''
        }order`;

        const orderingValue = query['url'].searchParams.get(orderingKey);

        if (!orderingValue) {
          throw new Error(`No ordering key found for path ${orderingKey}`);
        }

        const [column, ascending, _] = orderingValue.split('.');

        // cursor value is the gt or lt filter on the order key
        const q = new URLSearchParams(decodedKey.queryKey);
        const filters = q.getAll(
          `${foreignTablePath ? `${foreignTablePath}.` : ''}${column}`,
        );
        const filter = filters.find((f) =>
          f.startsWith(`${ascending === 'asc' ? 'gt' : 'lt'}.`),
        );

        if (!filter) {
          return {
            cursor: undefined,
            order: {
              ascending: ascending === 'asc',
              column,
              foreignTable: foreignTablePath ?? undefined,
            },
          };
        }
        const s = filter.split('.');
        s.shift();
        const cursorValue = s.join('.');
        return {
          cursor: cursorValue,
          order: {
            ascending: ascending === 'asc',
            column,
            foreignTable: foreignTablePath ?? undefined,
          },
        };
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
    const flatData = (data ?? []).flat();
    const pageSize = query ? query['url'].searchParams.get('limit') : null;

    if (query && !pageSize) {
      throw new Error('No limit filter found in query');
    }

    let hasLoadMore =
      !data ||
      (pageSize ? data[data.length - 1].length === Number(pageSize) : true);

    if (query && cursor.until) {
      // ordering key is foreignTable.order
      const pathSplit = cursor.path.split('.');
      let foreignTablePath = null;
      if (pathSplit.length > 1) {
        pathSplit.pop();
        foreignTablePath = pathSplit.join('.');
      }

      const orderingKey = `${
        foreignTablePath ? `${foreignTablePath}.` : ''
      }order`;

      const orderingValue = query['url'].searchParams.get(orderingKey);

      if (!orderingValue) {
        throw new Error(`No ordering key found for path ${orderingKey}`);
      }

      const [column, ascending, _] = orderingValue.split('.');

      const path = `${foreignTablePath ? `${foreignTablePath}.` : ''}${column}`;
      const lastElem = parseValue(
        get(flatData[flatData.length - 1], path) as string,
      );
      const until = parseValue(cursor.until);
      if (lastElem && until) {
        if (ascending === 'asc') {
          hasLoadMore = lastElem < until;
        } else {
          hasLoadMore = lastElem > until;
        }
      }
    }

    return {
      flatData,
      hasLoadMore,
    };
  }, [data, cursor]);

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
