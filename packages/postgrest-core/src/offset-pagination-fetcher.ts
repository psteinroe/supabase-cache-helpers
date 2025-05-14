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
  query: PostgrestTransformBuilder<Schema, Row, Result[], Relationships> | null,
  {
    decode,
    pageSize,
    applyToBody,
  }: {
    decode: PostgrestOffsetPaginationKeyDecoder<Args>;
    pageSize: number;
    applyToBody?: { limit: string; offset: string };
  },
): PostgrestOffsetPaginationFetcher<
  PostgrestPaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;

  return async (args) => {
    const decodedKey = decode(args);
    const limit = (decodedKey.limit ? decodedKey.limit - 1 : pageSize) - 1;
    const offset = decodedKey.offset ?? 0;

    return applyToBody
      ? await rpcOffsetPaginationFetcher<
          Schema,
          Row,
          Result,
          RelationName,
          Relationships
        >(query, { limit, offset, applyToBody })
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
  const { data } = await query.range(offset, offset + limit).throwOnError();
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
    applyToBody,
  }: {
    limit: number;
    offset: number;
    applyToBody: { limit: string; offset: string };
  },
) => {
  query['body'] = {
    ...(isPlainObject(query['body']) ? query['body'] : {}),
    // we are handling `limit` as with `.range()` so its inclusive.
    // rpcs expect it differently, hence the + 1
    [applyToBody.limit]: limit + 1,
    [applyToBody.offset]: offset,
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
  query: PostgrestTransformBuilder<
    Schema,
    Row,
    Result[],
    RelationName,
    Relationships
  > | null,
  {
    decode,
    pageSize,
    applyToBody,
  }: {
    decode: PostgrestOffsetPaginationKeyDecoder<Args>;
    pageSize: number;
    applyToBody?: { limit: string; offset: string };
  },
): PostgrestOffsetPaginationFetcher<
  PostgrestHasMorePaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const decodedKey = decode(args);
    const limit = decodedKey.limit ? decodedKey.limit - 1 : pageSize;
    const offset = decodedKey.offset ?? 0;
    return applyToBody
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
          applyToBody,
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
    applyToBody,
  }: {
    limit: number;
    offset: number;
    pageSize: number;
    applyToBody: { limit: string; offset: string };
  },
) => {
  query['body'] = {
    ...(isPlainObject(query['body']) ? query['body'] : {}),
    // we are handling `limit` as with `.range()` so its inclusive.
    // rpcs expect it differently, hence the + 1
    [applyToBody.limit]: limit + 1,
    [applyToBody.offset]: offset,
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
