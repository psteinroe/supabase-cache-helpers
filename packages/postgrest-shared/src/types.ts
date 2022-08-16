import {
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

export type PostgrestQuery = {
  schema: string;
  table: string;
  query: string;
  count: null | string;
  isHead: boolean;
};

export type PostgrestKey = PostgrestQuery & {
  isInfinite: boolean;
};

type PostgrestInfiniteCacheData<Type> = Type[][];

export type PostgrestCacheData<Type> =
  | Pick<PostgrestSingleResponse<Type>, "data">
  | Pick<PostgrestMaybeSingleResponse<Type>, "data">
  | Pick<PostgrestResponse<Type>, "data" | "count">
  | PostgrestInfiniteCacheData<Type>;

export const isInfiniteCacheData = <Type>(
  data: PostgrestCacheData<Type>
): data is PostgrestInfiniteCacheData<Type> => Array.isArray(data);
