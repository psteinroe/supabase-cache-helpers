import { encode } from './key';
import {
  get,
  isPlainObject,
  parseOrderBy,
  isPostgrestBuilder,
  offsetPaginationFetcher,
  rpcOffsetPaginationFetcher,
  offsetPaginationHasMoreFetcher,
  rpcOffsetPaginationHasMoreFetcher,
} from '@supabase-cache-helpers/postgrest-core';
import type { GenericSchema } from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';

/**
 * Creates a query key for infinite queries from a PostgrestBuilder
 */
export const createInfiniteQueryKey = <Result>(
  query: unknown,
): string[] | null => {
  if (!query) return null;
  if (!isPostgrestBuilder<Result>(query)) {
    throw new Error('Key is not a PostgrestBuilder');
  }
  return encode<Result>(query, true);
};

/**
 * Options for offset-based pagination
 */
export type OffsetPaginationOptions = {
  pageSize: number;
  rpcArgs?: { limit: string; offset: string };
};

/**
 * Creates a query function for offset-based pagination
 */
export const createOffsetPaginationQueryFn = <
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
>(
  queryFactory: () => PostgrestTransformBuilder<
    Options,
    Schema,
    Table,
    Result[],
    RelationName,
    Relationships
  >,
  { pageSize, rpcArgs }: OffsetPaginationOptions,
) => {
  return async ({ pageParam }: { pageParam: number }): Promise<Result[]> => {
    const query = queryFactory();
    const offset = pageParam;

    return rpcArgs
      ? rpcOffsetPaginationFetcher(query, { limit: pageSize, offset, rpcArgs })
      : offsetPaginationFetcher(query, { limit: pageSize, offset });
  };
};

/**
 * Creates a query function for offset-based pagination with hasMore flag
 */
export const createOffsetPaginationHasMoreQueryFn = <
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
>(
  queryFactory: () => PostgrestTransformBuilder<
    Options,
    Schema,
    Table,
    Result[],
    RelationName,
    Relationships
  >,
  { pageSize, rpcArgs }: OffsetPaginationOptions,
) => {
  return async ({
    pageParam,
  }: {
    pageParam: number;
  }): Promise<{ data: Result[]; hasMore: boolean }> => {
    const query = queryFactory();
    const offset = pageParam;

    return rpcArgs
      ? rpcOffsetPaginationHasMoreFetcher(query, {
          limit: pageSize,
          offset,
          pageSize,
          rpcArgs,
        })
      : offsetPaginationHasMoreFetcher(query, {
          limit: pageSize,
          offset,
          pageSize,
        });
  };
};

/**
 * Gets the next page param for offset-based pagination
 */
export const getNextOffsetPageParam = (pageSize: number) => {
  return (
    lastPage: unknown[] | { data: unknown[]; hasMore: boolean },
    _allPages: unknown[],
    lastPageParam: number,
  ): number | undefined => {
    // Handle hasMore response type
    if (
      lastPage &&
      typeof lastPage === 'object' &&
      'hasMore' in lastPage &&
      'data' in lastPage
    ) {
      if (!lastPage.hasMore) return undefined;
      return lastPageParam + pageSize;
    }

    // Handle plain array response
    if (Array.isArray(lastPage) && lastPage.length < pageSize) {
      return undefined;
    }
    return lastPageParam + pageSize;
  };
};

/**
 * Options for cursor-based pagination
 */
export type CursorPaginationOptions<
  Table extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
> = {
  orderBy: ColumnName;
  uqOrderBy?: ColumnName;
  rpcArgs?: { limit: string; orderBy: string; uqOrderBy?: string };
};

/**
 * Cursor page param type
 */
export type CursorPageParam = {
  orderBy?: string;
  uqOrderBy?: string;
} | null;

/**
 * Helper to parse order by for a column from a query
 */
export const parseOrderByForColumn = (
  searchParams: URLSearchParams,
  {
    orderByPath,
    uqOrderByPath,
  }: { orderByPath: string; uqOrderByPath?: string },
) => {
  const orderByDef = parseOrderBy(searchParams);
  const orderBy = orderByDef.find((o) => o.column === orderByPath);

  if (!orderBy) {
    throw new Error(`No ordering key found for path ${orderByPath}`);
  }

  const uqOrderBy = uqOrderByPath
    ? orderByDef.find((o) => o.column === uqOrderByPath)
    : null;

  return {
    orderBy,
    uqOrderBy,
  };
};

/**
 * Creates a query function for cursor-based pagination
 */
export const createCursorPaginationQueryFn = <
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  ColumnName extends string & keyof Table,
  RelationName = unknown,
  Relationships = unknown,
>(
  queryFactory: () => PostgrestTransformBuilder<
    Options,
    Schema,
    Table,
    Result[],
    RelationName,
    Relationships
  >,
  { orderBy, uqOrderBy, rpcArgs }: CursorPaginationOptions<Table, ColumnName>,
) => {
  return async ({
    pageParam,
  }: {
    pageParam: CursorPageParam;
  }): Promise<Result[]> => {
    const query = queryFactory();

    // First page - no cursor needed
    if (!pageParam || !pageParam.orderBy) {
      const { data, error } = await query.throwOnError();
      if (error) throw error;
      return data as Result[];
    }

    const { orderBy: orderByValue, uqOrderBy: uqOrderByValue } = pageParam;

    if (rpcArgs) {
      if (query['method'] === 'GET') {
        if (orderByValue) {
          query['url'].searchParams.set(rpcArgs.orderBy, orderByValue);
        }
        if (uqOrderByValue && rpcArgs.uqOrderBy) {
          query['url'].searchParams.set(rpcArgs.uqOrderBy, uqOrderByValue);
        }
      } else {
        query['body'] = {
          ...(isPlainObject(query['body']) ? query['body'] : {}),
          [rpcArgs.orderBy]: orderByValue,
          ...(uqOrderByValue && rpcArgs.uqOrderBy
            ? { [rpcArgs.uqOrderBy]: uqOrderByValue }
            : {}),
        };
      }
      const { data, error } = await query.throwOnError();
      if (error) throw error;
      return data as Result[];
    }

    // Parse order direction
    const { orderBy: mainOrderBy, uqOrderBy: uqOrderByDef } =
      parseOrderByForColumn(query['url'].searchParams, {
        orderByPath: orderBy,
        uqOrderByPath: uqOrderBy,
      });

    // Apply cursor filters
    if (uqOrderBy && uqOrderByDef && orderByValue && uqOrderByValue) {
      const operator = mainOrderBy.ascending ? 'gt' : 'lt';
      const uqOperator = uqOrderByDef.ascending ? 'gt' : 'lt';

      query['url'].searchParams.append(
        'or',
        `(${orderBy}.${operator}.${orderByValue},and(${orderBy}.eq.${orderByValue},${uqOrderBy}.${uqOperator}.${uqOrderByValue}))`,
      );
    } else if (orderByValue) {
      const operator = mainOrderBy.ascending ? 'gt' : 'lt';
      query['url'].searchParams.append(orderBy, `${operator}.${orderByValue}`);
    }

    const { data, error } = await query.throwOnError();
    if (error) throw error;
    return data as Result[];
  };
};

/**
 * Gets the next page param for cursor-based pagination
 */
export const getNextCursorPageParam = <
  Result extends Record<string, unknown>,
  ColumnName extends string,
>(
  orderBy: ColumnName,
  uqOrderBy?: ColumnName,
  pageSize?: number,
) => {
  return (
    lastPage: Result[],
    _allPages: Result[][],
    _lastPageParam: CursorPageParam,
  ): CursorPageParam | undefined => {
    if (!lastPage || lastPage.length === 0) {
      return undefined;
    }

    // If we know the page size and got less items, no more pages
    if (pageSize !== undefined && lastPage.length < pageSize) {
      return undefined;
    }

    const lastItem = lastPage[lastPage.length - 1];
    const orderByValue = get(lastItem, orderBy);

    if (!orderByValue) {
      return undefined;
    }

    const result: CursorPageParam = {
      orderBy: String(orderByValue),
    };

    if (uqOrderBy) {
      const uqOrderByValue = get(lastItem, uqOrderBy);
      if (uqOrderByValue) {
        result.uqOrderBy = String(uqOrderByValue);
      }
    }

    return result;
  };
};
