import { createCursorPaginationFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import { get } from '@supabase-cache-helpers/postgrest-filter';
import {
  PostgrestPaginationCacheData,
  PostgrestPaginationResponse,
} from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestError, PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/module/types';
import { isValidElement, useMemo } from 'react';
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
  Result extends Record<string, unknown>
> = Omit<
  SWRInfiniteResponse<PostgrestPaginationResponse<Result>, PostgrestError>,
  'data'
> & {
  loadMore: null | (() => void);
  data: Result[] | undefined;
};

export type CursorSettings<
  Table extends Record<string, unknown>,
  ColumnName extends string & keyof Table
> = {
  order: {
    column: ColumnName;
    ascending?: boolean;
    foreignTable?: string;
    nullsFirst?: boolean;
  };
  pageSize: number;
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
  Relationships = unknown
>(
  q: PostgrestFilterBuilder<Schema, Table, Result[], Relationships> | null,
  cursor: CursorSettings<Table, ColumnName>,
  config?: SWRInfiniteConfiguration
): UseCursorInfiniteScrollQueryReturn<Result> {
  const query = useMemo(
    () =>
      q === null
        ? null
        : q.order(cursor.order.column, cursor.order).limit(cursor.pageSize),
    [q, cursor]
  );
  const { data, setSize, size, isValidating, ...rest } = useSWRInfinite<
    PostgrestPaginationResponse<Result>,
    PostgrestError
  >(
    createCursorKeyGetter(query, {
      ...cursor,
      order: {
        column: cursor.order.column,
        ascending: Boolean(cursor.order.ascending),
        nullsFirst: Boolean(cursor.order.nullsFirst),
        foreignTable: cursor.order.foreignTable,
      },
    }),
    createCursorPaginationFetcher<Schema, Table, Result, string>(
      query,
      {
        ...cursor,
        order: {
          column: cursor.order.column,
          ascending: Boolean(cursor.order.ascending),
          nullsFirst: Boolean(cursor.order.nullsFirst),
          foreignTable: cursor.order.foreignTable,
        },
      },
      (key: string) => {
        const decodedKey = decode(key);
        if (!decodedKey) {
          throw new Error('Not a SWRPostgrest key');
        }
        // cursor value is the gt or lt filter on the order key
        const q = new URLSearchParams(decodedKey.queryKey);
        const filters = q.getAll(
          `${cursor.order.foreignTable ? `${cursor.order.foreignTable}` : ''}.${
            cursor.order.column
          }`
        );
        const filter = filters.find((f) =>
          f.startsWith(`${cursor.order.ascending ? 'gt' : 'lt'}.`)
        );
        if (!filter) {
          return { cursor: undefined };
        }
        const cursorValue = filter.split('.')[1];
        return {
          cursor: cursorValue,
        };
      }
    ),
    {
      ...config,
      use: [
        ...(config?.use ?? []),
        infiniteMiddleware as unknown as Middleware,
      ],
    }
  );

  const { flatData, hasLoadMore } = useMemo(() => {
    const flatData = (data ?? []).flat();
    let hasLoadMore = !data || data[data.length - 1].length === cursor.pageSize;

    if (cursor.until) {
      const path = `${
        cursor.order.foreignTable ? `${cursor.order.foreignTable}` : ''
      }.${cursor.order.column}`;
      const lastElem = get(flatData[flatData.length - 1], path) as string;
      if (cursor.order.ascending) {
        hasLoadMore = lastElem < cursor.until;
      } else {
        hasLoadMore = lastElem < cursor.until;
      }
    }

    return {
      flatData,
      hasLoadMore,
    };
  }, [data, cursor]);

  return {
    data: flatData,
    size,
    setSize,
    loadMore: hasLoadMore && !isValidating ? () => setSize(size + 1) : null,
    isValidating,
    ...rest,
  };
}

export { useCursorInfiniteScrollQuery };
