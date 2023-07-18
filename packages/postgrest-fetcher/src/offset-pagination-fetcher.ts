import {
  PostgrestPaginationResponse,
  PostgrestHasMorePaginationResponse,
} from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestTransformBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';

export type PostgrestOffsetPaginationFetcher<Type, Args> = (
  args: Args
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
  Relationships = unknown
>(
  query: PostgrestTransformBuilder<Schema, Row, Result[], Relationships> | null,
  decode: PostgrestOffsetPaginationKeyDecoder<Args>,
  pageSize: number
): PostgrestOffsetPaginationFetcher<
  PostgrestPaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const decodedKey = decode(args);
    const limit = (decodedKey.limit ? decodedKey.limit - 1 : pageSize) - 1;
    const offset = decodedKey.offset ?? 0;
    const { data } = await query.range(offset, offset + limit).throwOnError();
    // cannot be null because of .throwOnError()
    return data as Result[];
  };
};

export const createOffsetPaginationHasMoreFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args
>(
  query: PostgrestTransformBuilder<Schema, Row, Result[]> | null,
  decode: PostgrestOffsetPaginationKeyDecoder<Args>,
  pageSize: number
): PostgrestOffsetPaginationFetcher<
  PostgrestHasMorePaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const decodedKey = decode(args);
    const limit = decodedKey.limit ? decodedKey.limit - 1 : pageSize;
    const offset = decodedKey.offset ?? 0;
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
};
