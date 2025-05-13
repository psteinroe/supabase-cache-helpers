import type { PostgrestTransformBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';

import type { PostgrestPaginationResponse } from './lib/response-types';
import { parseOrderBy } from './lib/parse-order-by';

export type PostgrestCursorPaginationFetcher<Type, Args> = (
  args: Args,
) => Promise<Type>;

export type PostgrestCursorPaginationKeyDecoder<Args> = (args: Args) => {
  orderBy?: string;
  uqOrderBy?: string;
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
  config: {
    orderBy: string;
    uqColumn?: string;
  },
): PostgrestCursorPaginationFetcher<
  PostgrestPaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const cursor = decode(args);

    const orderByDef = parseOrderBy(query['url'].searchParams);
    const orderBy = orderByDef.find((o) => o.column === config.orderBy);

    if (!orderBy) {
      throw new Error(`No ordering key found for path ${config.orderBy}`);
    }

    const uqOrderBy = config.uqColumn
      ? orderByDef.find((o) => o.column === config.uqColumn)
      : null;

    if (cursor.orderBy && config.uqColumn && cursor.uqOrderBy && uqOrderBy) {
      const operator = orderBy.ascending ? 'gt' : 'lt';
      const uqOperator = uqOrderBy.ascending ? 'gt' : 'lt';

      query['url'].searchParams.append(
        'or',
        `(${config.orderBy}.${operator}."${cursor.orderBy}",and(${config.orderBy}.eq."${cursor.orderBy}",${config.uqColumn}.${uqOperator}."${cursor.uqOrderBy}"))`,
      );
    } else if (cursor.orderBy) {
      const operator = orderBy.ascending ? 'gt' : 'lt';
      query['url'].searchParams.append(
        config.orderBy,
        `${operator}.${cursor.orderBy}`,
      );
    }

    const { data } = await query.throwOnError();

    // cannot be null because of .throwOnError()
    return data as Result[];
  };
};
