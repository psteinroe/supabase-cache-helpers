import { OrderDefinition } from '@supabase-cache-helpers/postgrest-filter';
import { PostgrestPaginationResponse } from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';

export type PostgrestCursorPaginationFetcher<Type, Args> = (
  args: Args
) => Promise<Type>;

export type PostgrestCursorPaginationKeyDecoder<Args> = (args: Args) => {
  cursor?: string;
};

export type CursorPaginatorSettings = {
  order: OrderDefinition;
};

export const createCursorPaginationFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args,
  Relationships = unknown
>(
  query: PostgrestFilterBuilder<Schema, Row, Result[], Relationships> | null,
  { order }: CursorPaginatorSettings,
  decode: PostgrestCursorPaginationKeyDecoder<Args>
): PostgrestCursorPaginationFetcher<
  PostgrestPaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const { cursor } = decode(args);

    let q = query;

    if (cursor) {
      q = q[order.ascending ? 'gt' : 'lt'](
        `${order.foreignTable ? `${order.foreignTable}.` : ''}${order.column}`,
        cursor
      );
    }

    const { data } = await q.throwOnError();
    // cannot be null because of .throwOnError()
    return data as Result[];
  };
};
