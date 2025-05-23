import type { PostgrestTransformBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';

import { isPlainObject } from './lib/is-plain-object';
import type {
  PostgrestHasMorePaginationResponse,
  PostgrestPaginationResponse,
} from './lib/response-types';

export type PostgrestOffsetPaginationFetcher<Type, Args> = (
  args: Args,
) => Promise<Type>;

export type PostgrestOffsetPaginationKeyDecoder<Args> = (args: Args) => {
  limit?: number;
  offset?: number;
};

export const createOffsetPaginationFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args,
  RelationName = unknown,
  Relationships = unknown,
>(
  queryFactory:
    | (() => PostgrestTransformBuilder<Schema, Row, Result[], Relationships>)
    | null,
  {
    decode,
    pageSize,
    rpcArgs,
  }: {
    decode: PostgrestOffsetPaginationKeyDecoder<Args>;
    pageSize: number;
    rpcArgs?: { limit: string; offset: string };
  },
): PostgrestOffsetPaginationFetcher<
  PostgrestPaginationResponse<Result>,
  Args
> | null => {
  if (!queryFactory) return null;

  return async (args) => {
    const decodedKey = decode(args);
    const limit = decodedKey.limit ? decodedKey.limit : pageSize;
    const offset = decodedKey.offset ?? 0;

    const query = queryFactory();

    return rpcArgs
      ? await rpcOffsetPaginationFetcher<
          Schema,
          Row,
          Result,
          RelationName,
          Relationships
        >(query, { limit, offset, rpcArgs })
      : await offsetPaginationFetcher<
          Schema,
          Row,
          Result,
          RelationName,
          Relationships
        >(query, { limit, offset });
  };
};

export const offsetPaginationFetcher = async <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  RelationName = unknown,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Schema,
    Row,
    Result[],
    RelationName,
    Relationships
  >,
  { limit, offset }: { limit: number; offset: number },
) => {
  const { data } = await query.range(offset, offset + limit - 1).throwOnError();
  // cannot be null because of .throwOnError()
  return data as Result[];
};

export const rpcOffsetPaginationFetcher = async <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  RelationName = unknown,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Schema,
    Row,
    Result[],
    RelationName,
    Relationships
  >,
  {
    limit,
    offset,
    rpcArgs,
  }: {
    limit: number;
    offset: number;
    rpcArgs: { limit: string; offset: string };
  },
) => {
  query['body'] = {
    ...(isPlainObject(query['body']) ? query['body'] : {}),
    [rpcArgs.limit]: limit,
    [rpcArgs.offset]: offset,
  };

  const { data } = await query.throwOnError();

  // cannot be null because of .throwOnError()
  return data as Result[];
};

export const createOffsetPaginationHasMoreFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args,
  RelationName = unknown,
  Relationships = unknown,
>(
  queryFactory:
    | (() => PostgrestTransformBuilder<
        Schema,
        Row,
        Result[],
        RelationName,
        Relationships
      >)
    | null,
  {
    decode,
    pageSize,
    rpcArgs,
  }: {
    decode: PostgrestOffsetPaginationKeyDecoder<Args>;
    pageSize: number;
    rpcArgs?: { limit: string; offset: string };
  },
): PostgrestOffsetPaginationFetcher<
  PostgrestHasMorePaginationResponse<Result>,
  Args
> | null => {
  if (!queryFactory) return null;
  return async (args) => {
    const decodedKey = decode(args);
    const limit = decodedKey.limit ? decodedKey.limit : pageSize;
    const offset = decodedKey.offset ?? 0;
    const query = queryFactory();
    return rpcArgs
      ? await rpcOffsetPaginationHasMoreFetcher<
          Schema,
          Row,
          Result,
          RelationName,
          Relationships
        >(query, {
          limit,
          offset,
          pageSize,
          rpcArgs,
        })
      : await offsetPaginationHasMoreFetcher<
          Schema,
          Row,
          Result,
          RelationName,
          Relationships
        >(query, {
          limit,
          offset,
          pageSize,
        });
  };
};

export const offsetPaginationHasMoreFetcher = async <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  RelationName = unknown,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Schema,
    Row,
    Result[],
    RelationName,
    Relationships
  >,
  {
    limit,
    offset,
    pageSize,
  }: { limit: number; offset: number; pageSize: number },
) => {
  const { data } = await query.range(offset, offset + limit).throwOnError();

  let hasMore = false;
  if (data && data.length === pageSize + 1) {
    hasMore = true;
    data.pop();
  }
  return {
    // cannot be null because of .throwOnError()
    data: data as Result[],
    hasMore,
  };
};

export const rpcOffsetPaginationHasMoreFetcher = async <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  RelationName = unknown,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Schema,
    Row,
    Result[],
    RelationName,
    Relationships
  >,
  {
    limit,
    offset,
    pageSize,
    rpcArgs,
  }: {
    limit: number;
    offset: number;
    pageSize: number;
    rpcArgs: { limit: string; offset: string };
  },
) => {
  query['body'] = {
    ...(isPlainObject(query['body']) ? query['body'] : {}),
    [rpcArgs.limit]: limit + 1,
    [rpcArgs.offset]: offset,
  };

  const { data } = await query.throwOnError();

  let hasMore = false;
  if (data && data.length === pageSize + 1) {
    hasMore = true;
    data.pop();
  }
  return {
    // cannot be null because of .throwOnError()
    data: data as Result[],
    hasMore,
  };
};
