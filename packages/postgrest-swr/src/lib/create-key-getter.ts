import {
  type PostgrestHasMorePaginationResponse,
  type PostgrestPaginationResponse,
  get,
  isPlainObject,
  isPostgrestHasMorePaginationResponse,
  isPostgrestPaginationResponse,
} from '@supabase-cache-helpers/postgrest-core';
import type { PostgrestTransformBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';
import { parseOrderBy } from './parse-order-by';

export const createOffsetKeyGetter = <
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result,
>(
  queryFactory: (() => PostgrestTransformBuilder<Schema, Table, Result>) | null,
  {
    pageSize,
    rpcArgs,
  }: {
    pageSize: number;
    rpcArgs?: { limit: string; offset: string };
  },
) => {
  if (!queryFactory) return () => null;
  return (
    pageIndex: number,
    previousPageData: (
      | PostgrestHasMorePaginationResponse<Result>
      | PostgrestPaginationResponse<Result>
    )[],
  ) => {
    if (
      previousPageData &&
      ((isPostgrestHasMorePaginationResponse(previousPageData) &&
        !previousPageData.data.length) ||
        (isPostgrestPaginationResponse(previousPageData) &&
          !previousPageData.length))
    ) {
      return null;
    }
    const cursor = pageIndex * pageSize;

    const query = queryFactory();

    if (rpcArgs) {
      query['body'] = {
        ...(isPlainObject(query['body']) ? query['body'] : {}),
        [rpcArgs.limit]: pageSize,
        [rpcArgs.offset]: cursor,
      };

      return query;
    }

    return query.range(cursor, cursor + pageSize - 1);
  };
};

export const createCursorKeyGetter = <
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result,
>(
  queryFactory: (() => PostgrestTransformBuilder<Schema, Table, Result>) | null,
  {
    orderBy,
    uqOrderBy: uqColumn,
    rpcArgs,
  }: {
    orderBy: string;
    uqOrderBy?: string;
    rpcArgs?: { orderBy: string; uqOrderBy?: string };
  },
) => {
  if (!queryFactory) return () => null;

  return (
    _pageIndex: number,
    previousPageData: (
      | PostgrestHasMorePaginationResponse<Result>
      | PostgrestPaginationResponse<Result>
    )[],
  ) => {
    // Return null if we've reached the end of the data
    if (previousPageData && isEmptyPreviousPage(previousPageData)) {
      return null;
    }

    const query = queryFactory();

    // If this is the first page, return the original query
    if (!previousPageData) return query;

    // Extract the last values for cursor-based pagination
    const lastItem = getLastItem(previousPageData);

    if (!lastItem) return query;

    const lastValueOrderBy = get(lastItem, orderBy);
    if (!lastValueOrderBy) return query;

    const lastValueUqColumn = uqColumn ? get(lastItem, uqColumn) : null;

    if (rpcArgs) {
      query['body'] = {
        ...(isPlainObject(query['body']) ? query['body'] : {}),
        [rpcArgs.orderBy]: lastValueOrderBy,
        ...(lastValueUqColumn && rpcArgs.uqOrderBy
          ? { [rpcArgs.uqOrderBy]: lastValueUqColumn }
          : {}),
      };

      return query;
    }

    const { orderBy: mainOrderBy, uqOrderBy } = parseOrderBy(
      query['url'].searchParams,
      { orderByPath: orderBy, uqOrderByPath: uqColumn },
    );

    // Apply cursor filters
    if (uqColumn && uqOrderBy && lastValueOrderBy && lastValueUqColumn) {
      const operator = mainOrderBy.ascending ? 'gt' : 'lt';
      const uqOperator = uqOrderBy.ascending ? 'gt' : 'lt';

      query['url'].searchParams.append(
        'or',
        `(${orderBy}.${operator}.${lastValueOrderBy},and(${orderBy}.eq.${lastValueOrderBy},${uqColumn}.${uqOperator}.${lastValueUqColumn}))`,
      );
    } else if (lastValueOrderBy) {
      const operator = mainOrderBy.ascending ? 'gt' : 'lt';
      query['url'].searchParams.append(
        orderBy,
        `${operator}.${lastValueOrderBy}`,
      );
    }

    return query;
  };
};

// Helper functions
function isEmptyPreviousPage<Result>(
  previousPageData: (
    | PostgrestHasMorePaginationResponse<Result>
    | PostgrestPaginationResponse<Result>
  )[],
): boolean {
  return (
    (isPostgrestHasMorePaginationResponse(previousPageData) &&
      !previousPageData.data.length) ||
    (isPostgrestPaginationResponse(previousPageData) &&
      !previousPageData.length)
  );
}

function getLastItem<Result>(
  data: (
    | PostgrestHasMorePaginationResponse<Result>
    | PostgrestPaginationResponse<Result>
  )[],
): Result | null {
  if (isPostgrestHasMorePaginationResponse(data)) {
    return data.data.length
      ? (data.data[data.data.length - 1] as Result)
      : null;
  } else if (isPostgrestPaginationResponse(data)) {
    return data.length ? (data[data.length - 1] as Result) : null;
  }
  return null;
}
