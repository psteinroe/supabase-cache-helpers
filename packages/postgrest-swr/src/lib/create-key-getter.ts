import { setFilterValue } from '@supabase-cache-helpers/postgrest-fetcher';
import { get, OrderDefinition } from '@supabase-cache-helpers/postgrest-filter';
import {
  isPostgrestHasMorePaginationResponse,
  isPostgrestPaginationResponse,
  PostgrestHasMorePaginationResponse,
  PostgrestPaginationResponse,
} from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestTransformBuilder } from '@supabase/postgrest-js';
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
  query: PostgrestTransformBuilder<Schema, Table, Result> | null,
  {
    path,
  }: {
    path: string;
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

    let lastValue = null;
    if (isPostgrestHasMorePaginationResponse(previousPageData)) {
      lastValue = get(
        previousPageData.data[previousPageData.data.length - 1],
        path
      );
    } else if (isPostgrestPaginationResponse(previousPageData)) {
      lastValue = get(previousPageData[previousPageData.length - 1], path);
    }

    if (!lastValue) return query;

    // ordering key is foreignTable.order
    const pathSplit = path.split('.');
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

    const [a, ascending, b] = orderingKey.split('.');

    setFilterValue(
      query['url'].searchParams,
      path,
      ascending === 'asc' ? 'lt' : 'gt',
      lastValue
    );

    return query;
  };
};
