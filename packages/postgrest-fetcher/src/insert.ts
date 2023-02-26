import { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { GenericTable } from "@supabase/postgrest-js/dist/module/types";
import { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";

import { LoadQueryOps, loadQuery } from "./lib/load-query";

export type InsertFetcher<T extends GenericTable, R> = (
  input: T["Insert"][]
) => Promise<R[]>;

function buildInsertFetcher<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(qb: PostgrestQueryBuilder<S, T>, opts: LoadQueryOps): InsertFetcher<T, R> {
  return async (input: T["Insert"][]): Promise<R[]> => {
    const selectQuery = loadQuery(opts);
    if (selectQuery) {
      const { data } = await qb
        .insert(input as any)
        .select(selectQuery)
        .throwOnError();
      return data as R[]; // data cannot be null because of throwOnError()
    }
    const { data } = await qb.insert(input as any).throwOnError();
    return data as R[]; // data cannot be null because of throwOnError()
  };
}

export { buildInsertFetcher };
