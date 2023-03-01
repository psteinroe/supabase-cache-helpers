import { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { GenericTable } from "@supabase/postgrest-js/dist/module/types";
import { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";

import { LoadQueryOps, loadQuery } from "./lib/load-query";
import {
  buildMutationFetcherResponse,
  MutationFetcherResponse,
} from "./lib/mutation-response";

export type InsertFetcher<T extends GenericTable, R> = (
  input: T["Insert"][]
) => Promise<MutationFetcherResponse<R>[] | null>;

function buildInsertFetcher<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(qb: PostgrestQueryBuilder<S, T>, opts: LoadQueryOps): InsertFetcher<T, R> {
  return async (
    input: T["Insert"][]
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    const query = loadQuery(opts);
    if (query) {
      const { selectQuery, userQueryPaths, paths } = query;
      const { data } = await qb
        .insert(input as any)
        .select(selectQuery)
        .throwOnError();
      // data cannot be null because of throwOnError()
      return (data as R[]).map((d) =>
        buildMutationFetcherResponse(d, { paths, userQueryPaths })
      );
    }
    await qb.insert(input as any).throwOnError();
    return null;
  };
}

export { buildInsertFetcher };
