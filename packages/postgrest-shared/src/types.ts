import {
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

export type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

export type GenericFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

type PostgrestPaginationCacheData<Type> = Type[][];

export type PostgrestCacheData<Type> =
  | Pick<PostgrestSingleResponse<Type>, "data">
  | Pick<PostgrestMaybeSingleResponse<Type>, "data">
  | Pick<PostgrestResponse<Type>, "data" | "count">
  | PostgrestPaginationCacheData<Type>;

export const isPaginationCacheData = <Type>(
  data: PostgrestCacheData<Type>
): data is PostgrestPaginationCacheData<Type> => Array.isArray(data);

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
  schema?: string;
};
