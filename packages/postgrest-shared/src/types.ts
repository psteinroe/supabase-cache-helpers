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
): data is PostgrestPaginationCacheData<Type> =>
  Array.isArray(data) && data.length > 0 && Array.isArray(data[0]);

export type RevalidateTableOpt = { schema?: string; table: string };

export type RevalidateRelationOpt<Type> = {
  schema?: string;
  relation: string;
  relationIdColumn: string;
  fKeyColumn: keyof Type;
};
export type PostgrestMutatorOpts<Type> = {
  /**
   * Will set all keys of the tables to stale
   */
  revalidateTables?: RevalidateTableOpt[];
  /**
   * Will set all keys of the tables where relation.primaryKey === myObj.fKey
   */
  revalidateRelations?: RevalidateRelationOpt<Type>[];
};

export type DecodedKey = {
  bodyKey: string | undefined;
  queryKey: string;
  count: string | null;
  schema: string | undefined;
  table: string;
  isHead: boolean | undefined;
  limit: number | undefined;
  offset: number | undefined;
};
