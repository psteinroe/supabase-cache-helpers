import {
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

type PostgrestPaginationCacheData<Type> = Type[][];

export type PostgrestCacheData<Type> =
  | Pick<PostgrestSingleResponse<Type>, "data">
  | Pick<PostgrestMaybeSingleResponse<Type>, "data">
  | Pick<PostgrestResponse<Type>, "data" | "count">
  | PostgrestPaginationCacheData<Type>;

export const isPaginationCacheData = <Type>(
  data: PostgrestCacheData<Type>
): data is PostgrestPaginationCacheData<Type> => Array.isArray(data);
