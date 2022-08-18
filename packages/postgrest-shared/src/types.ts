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

export type PostgrestMutatorOpts<Type> = {
  /**
   * Will set all keys of the tables to stale
   */
  revalidateTables?: { schema?: string; table: string }[];
  /**
   * Will set all keys of the tables where relation.primaryKey === myObj.fKey
   */
  revalidateRelations?: {
    schema?: string;
    relation: string;
    relationIdColumn: string;
    fKeyColumn: keyof Type;
  }[];
  schema?: string;
};
