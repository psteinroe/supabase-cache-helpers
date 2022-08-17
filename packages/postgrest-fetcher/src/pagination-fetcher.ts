import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export type PostgrestPaginationFetcher<Type, Args extends any[]> = (
  ...args: Args
) => Promise<Type[] | undefined>;

export type PostgrestPaginationKeyDecoder<Args extends any[]> = (
  ...args: Args
) => {
  limit?: number;
  offset?: number;
};

export const createPaginationFetcher = <Type, Args extends any[]>(
  query: PostgrestFilterBuilder<Type> | null,
  decode: PostgrestPaginationKeyDecoder<Args>,
  pageSize: number
): PostgrestPaginationFetcher<Type, Args> | null => {
  if (!query) return null;
  return async (...args) => {
    const decodedKey = decode(...args);
    const limit = (decodedKey.limit ?? pageSize) - 1;
    const offset = decodedKey.offset ?? 0;
    const { data } = await query
      .range(offset, offset + limit)
      .throwOnError(true);
    return data ?? undefined;
  };
};

export const createPaginationHasMoreFetcher = <Type, Args extends any[]>(
  query: PostgrestFilterBuilder<Type> | null,
  decode: PostgrestPaginationKeyDecoder<Args>,
  pageSize: number
): PostgrestPaginationFetcher<Type | { hasMore: true }, Args> | null => {
  if (!query) return null;
  return async (...args) => {
    const decodedKey = decode(...args);
    const limit = decodedKey.limit ?? pageSize;
    const offset = decodedKey.offset ?? 0;
    const result = await query.range(offset, offset + limit).throwOnError(true);
    const data: Awaited<
      ReturnType<PostgrestPaginationFetcher<Type | { hasMore: true }, Args>>
    > | null = result.data;
    if (data && data.length === pageSize + 1) {
      data[data.length - 1] = { hasMore: true };
    }
    return data ?? undefined;
  };
};
