import type { PostgrestTransformBuilder } from "@supabase/postgrest-js";
import type { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";

import type {
  PostgrestHasMorePaginationResponse,
  PostgrestPaginationResponse,
} from "./lib/response-types";

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
  decode: PostgrestOffsetPaginationKeyDecoder<Args>,
  pageSize: number,
): PostgrestOffsetPaginationFetcher<
  PostgrestPaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const decodedKey = decode(args);
    const limit = (decodedKey.limit ? decodedKey.limit - 1 : pageSize) - 1;
    const offset = decodedKey.offset ?? 0;
    return await offsetPaginationFetcher<
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
  decode: PostgrestOffsetPaginationKeyDecoder<Args>,
  pageSize: number,
): PostgrestOffsetPaginationFetcher<
  PostgrestHasMorePaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const decodedKey = decode(args);
    const limit = decodedKey.limit ? decodedKey.limit - 1 : pageSize;
    const offset = decodedKey.offset ?? 0;
    return await offsetPaginationHasMoreFetcher<
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
