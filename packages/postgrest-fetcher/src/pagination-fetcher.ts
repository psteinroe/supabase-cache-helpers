import {
  PostgrestPaginationResponse,
  PostgrestHasMorePaginationResponse,
} from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestTransformBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';

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
  query: PostgrestTransformBuilder<Schema, Row, Result[]> | null,
  decode: PostgrestPaginationKeyDecoder<Args>,
  pageSize: number
): PostgrestPaginationFetcher<
  PostgrestPaginationResponse<Result>,
  Args
> | null => {
  if (!query) return null;
  return async (args) => {
    const decodedKey = decode(args);
    const limit = (decodedKey.limit ?? pageSize) - 1;
    const offset = decodedKey.offset ?? 0;
    const { data } = await query.range(offset, offset + limit).throwOnError();
    // cannot be null because of .throwOnError()
    return data as Result[];
  };
};

export const createPaginationHasMoreFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args
>(
  query: PostgrestTransformBuilder<Schema, Row, Result[]> | null,
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
