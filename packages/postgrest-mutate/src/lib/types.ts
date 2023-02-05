import {
  AnyPostgrestResponse,
  PostgrestHasMorePaginationResponse,
} from "@supabase-cache-helpers/postgrest-shared";

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

export type MutatorFn<Type> = (
  currentData:
    | AnyPostgrestResponse<Type>
    | PostgrestHasMorePaginationResponse<Type>
    | unknown
) =>
  | AnyPostgrestResponse<Type>
  | PostgrestHasMorePaginationResponse<Type>
  | unknown;

export type DecodedKey = {
  bodyKey: string | undefined;
  orderByKey: string | undefined;
  queryKey: string;
  count: string | null;
  schema: string | undefined;
  table: string;
  isHead: boolean | undefined;
  limit: number | undefined;
  offset: number | undefined;
};

export type UpsertMutatorConfig<Type extends Record<string, unknown>> = {
  merge?: (current: Type, input: Type) => Type;
};
