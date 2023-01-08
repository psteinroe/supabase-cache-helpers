import { PostgrestTransformBuilder } from "@supabase/postgrest-js";
import { PostgrestHasMorePaginationResponse } from "@supabase-cache-helpers/postgrest-shared";
import { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";

export type PostgrestPaginationFetcher<Type, Args> = (
  args: Args
) => Promise<Type>;

export type PostgrestPaginationKeyDecoder<Args> = (args: Args) => {
  limit?: number;
  offset?: number;
};

export const createPaginationFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args
>(
  query: PostgrestTransformBuilder<Schema, Row, Result> | null,
  decode: PostgrestPaginationKeyDecoder<Args>,
  pageSize: number
): PostgrestPaginationFetcher<Result[], Args> | null => {
  if (!query) return null;
  return async (args) => {
    const decodedKey = decode(args);
    const limit = (decodedKey.limit ?? pageSize) - 1;
    const offset = decodedKey.offset ?? 0;
    const { data } = await query.range(offset, offset + limit).throwOnError();
    return data ?? [];
  };
};

export const createPaginationHasMoreFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args
>(
  query: PostgrestTransformBuilder<Schema, Row, Result> | null,
  decode: PostgrestPaginationKeyDecoder<Args>,
  pageSize: number
): PostgrestPaginationFetcher<
  PostgrestHasMorePaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const decodedKey = decode(args);
    const limit = decodedKey.limit ?? pageSize;
    const offset = decodedKey.offset ?? 0;
    const { data } = await query.range(offset, offset + limit).throwOnError();
    return {
      data: data ?? [],
      hasMore: Array.isArray(data) && data.length === pageSize + 1,
    };
  };
};
