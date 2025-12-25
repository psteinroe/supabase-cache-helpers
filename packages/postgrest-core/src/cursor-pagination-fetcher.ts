import { isPlainObject } from './lib/is-plain-object';
import { parseOrderBy } from './lib/parse-order-by';
import type { PostgrestPaginationResponse } from './lib/response-types';
import type {
  PostgrestClientOptions,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';

export type PostgrestCursorPaginationFetcher<Type, Args> = (
  args: Args,
) => Promise<Type>;

export type PostgrestCursorPaginationKeyDecoder<Args> = (args: Args) => {
  orderBy?: string;
  uqOrderBy?: string;
};

export const createCursorPaginationFetcher = <
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args,
  Relationships = unknown,
>(
  queryFactory:
    | (() => PostgrestTransformBuilder<
        Options,
        Schema,
        Row,
        Result[],
        Relationships
      >)
    | null,
  config: {
    decode: PostgrestCursorPaginationKeyDecoder<Args>;
    orderBy: string;
    uqOrderBy?: string;
    rpcArgs?: { orderBy: string; uqOrderBy?: string };
  },
): PostgrestCursorPaginationFetcher<
  PostgrestPaginationResponse<Result>,
  Args
> | null => {
  if (!queryFactory) return null;
  return async (args) => {
    const cursor = config.decode(args);

    const query = queryFactory();

    if (config.rpcArgs) {
      if (query['method'] === 'GET') {
        if (cursor.orderBy) {
          query['url'].searchParams.set(config.rpcArgs.orderBy, cursor.orderBy);
        }
        if (config.rpcArgs.uqOrderBy && cursor.uqOrderBy) {
          query['url'].searchParams.set(
            config.rpcArgs.uqOrderBy,
            cursor.uqOrderBy,
          );
        }
      } else {
        query['body'] = {
          ...(isPlainObject(query['body']) ? query['body'] : {}),
          [config.rpcArgs.orderBy]: cursor.orderBy,
          ...(cursor.uqOrderBy && config.rpcArgs.uqOrderBy
            ? { [config.rpcArgs.uqOrderBy]: cursor.uqOrderBy }
            : {}),
        };
      }

      const { data } = await query.throwOnError();

      // cannot be null because of .throwOnError()
      return data as Result[];
    }

    const orderByDef = parseOrderBy(query['url'].searchParams);
    const orderBy = orderByDef.find((o) => o.column === config.orderBy);

    if (!orderBy) {
      throw new Error(`No ordering key found for path ${config.orderBy}`);
    }

    const uqOrderBy = config.uqOrderBy
      ? orderByDef.find((o) => o.column === config.uqOrderBy)
      : null;

    if (cursor.orderBy && config.uqOrderBy && cursor.uqOrderBy && uqOrderBy) {
      const operator = orderBy.ascending ? 'gt' : 'lt';
      const uqOperator = uqOrderBy.ascending ? 'gt' : 'lt';

      query['url'].searchParams.append(
        'or',
        `(${config.orderBy}.${operator}."${cursor.orderBy}",and(${config.orderBy}.eq."${cursor.orderBy}",${config.uqOrderBy}.${uqOperator}."${cursor.uqOrderBy}"))`,
      );
    } else if (cursor.orderBy) {
      const operator = orderBy.ascending ? 'gt' : 'lt';
      query['url'].searchParams.append(
        config.orderBy,
        `${operator}.${cursor.orderBy}`,
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    // cannot be null because of .throwOnError()
    return data as Result[];
  };
};
