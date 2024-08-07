import type { PostgrestTransformBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';

import type { OrderDefinition } from './lib/query-types';
import type { PostgrestPaginationResponse } from './lib/response-types';
import { setFilterValue } from './lib/set-filter-value';

export type PostgrestCursorPaginationFetcher<Type, Args> = (
  args: Args,
) => Promise<Type>;

export type PostgrestCursorPaginationKeyDecoder<Args> = (args: Args) => {
  cursor?: string;
  order: Pick<OrderDefinition, 'column' | 'ascending' | 'foreignTable'>;
};

export const createCursorPaginationFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<Schema, Row, Result[], Relationships> | null,
  decode: PostgrestCursorPaginationKeyDecoder<Args>,
): PostgrestCursorPaginationFetcher<
  PostgrestPaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const { cursor, order } = decode(args);

    if (cursor) {
      setFilterValue(
        query['url'].searchParams,
        `${order.foreignTable ? `${order.foreignTable}.` : ''}${order.column}`,
        order.ascending ? 'gt' : 'lt',
        cursor,
      );
    }

    const { data } = await query.throwOnError();

    // cannot be null because of .throwOnError()
    return data as Result[];
  };
};
