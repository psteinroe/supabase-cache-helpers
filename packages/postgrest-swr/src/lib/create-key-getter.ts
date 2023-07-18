import { get, OrderDefinition } from '@supabase-cache-helpers/postgrest-filter';
import {
  isPostgrestHasMorePaginationResponse,
  isPostgrestPaginationResponse,
  PostgrestHasMorePaginationResponse,
  PostgrestPaginationResponse,
} from '@supabase-cache-helpers/postgrest-shared';
import {
  PostgrestFilterBuilder,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/module/types';

export const createOffsetKeyGetter = <
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
  query: PostgrestTransformBuilder<Schema, Table, Result> | null,
  pageSize: number
) => {
  if (!query) return () => null;
  return (
    pageIndex: number,
    previousPageData: (
      | PostgrestHasMorePaginationResponse<Result>
      | PostgrestPaginationResponse<Result>
    )[]
  ) => {
    if (
      previousPageData &&
      ((isPostgrestHasMorePaginationResponse(previousPageData) &&
        !previousPageData.data.length) ||
        (isPostgrestPaginationResponse(previousPageData) &&
          !previousPageData.length))
    )
      return null;
    const cursor = pageIndex * pageSize;
    return query.range(cursor, cursor + pageSize);
  };
};

export const createCursorKeyGetter = <
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
  query: PostgrestFilterBuilder<Schema, Table, Result> | null,
  {
    order,
    pageSize,
  }: {
    order: OrderDefinition;
    pageSize: number;
  }
) => {
  if (!query) return () => null;
  return (
    pageIndex: number,
    previousPageData: (
      | PostgrestHasMorePaginationResponse<Result>
      | PostgrestPaginationResponse<Result>
    )[]
  ) => {
    if (
      previousPageData &&
      ((isPostgrestHasMorePaginationResponse(previousPageData) &&
        !previousPageData.data.length) ||
        (isPostgrestPaginationResponse(previousPageData) &&
          !previousPageData.length))
    )
      return null;

    const columnRef = `${order.foreignTable ? `${order.foreignTable}.` : ''}${
      order.column
    }`;

    let lastValue = null;
    if (isPostgrestHasMorePaginationResponse(previousPageData)) {
      lastValue = get(
        previousPageData.data[previousPageData.data.length - 1],
        columnRef
      );
    } else if (isPostgrestPaginationResponse(previousPageData)) {
      lastValue = get(previousPageData[previousPageData.length - 1], columnRef);
    }

    if (!lastValue) return query;

    return query[order.ascending ? 'gt' : 'lt'](columnRef, lastValue);
  };
};
