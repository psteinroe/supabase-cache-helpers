import { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { GenericTable } from "@supabase/postgrest-js/dist/module/types";
import { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";

export type InsertFetcher<T extends GenericTable, R> = (
  input: T["Insert"] | T["Insert"][]
) => Promise<R[]>;

function buildInsertFetcher<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(qb: PostgrestQueryBuilder<S, T>, query?: Q): InsertFetcher<T, R> {
  return async (input: T["Insert"] | T["Insert"][]): Promise<R[]> => {
    if (!Array.isArray(input)) input = [input];
    const filterBuilder = qb
      .insert(input as any)
      .throwOnError()
      .select(query ?? "*");

    if (!Array.isArray(input)) {
      const { data } = await filterBuilder.single();
      return [data] as R[]; // data cannot be null because of throwOnError()
    } else {
      const { data } = await filterBuilder;
      return data as R[]; // data cannot be null because of throwOnError()
    }
  };
}

export { buildInsertFetcher };
