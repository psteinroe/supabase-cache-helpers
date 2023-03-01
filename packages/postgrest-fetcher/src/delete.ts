import {
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
  PostgrestTransformBuilder,
} from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";

import { loadQuery, LoadQueryOps } from "./lib/load-query";
import {
  buildMutationFetcherResponse,
  MutationFetcherResponse,
} from "./lib/mutation-response";

export type DeleteFetcher<T extends GenericTable, R> = (
  input: Partial<T["Row"]>
) => Promise<MutationFetcherResponse<R> | null>;

export const buildDeleteFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    Q extends string = "*",
    R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
  >(
    qb: PostgrestQueryBuilder<S, T>,
    primaryKeys: (keyof T["Row"])[],
    opts: LoadQueryOps
  ): DeleteFetcher<T, R> =>
  async (
    input: Partial<T["Row"]>
  ): Promise<MutationFetcherResponse<R> | null> => {
    let filterBuilder = qb.delete();
    for (const key of primaryKeys) {
      const value = input[key];
      if (!value)
        throw new Error(`Missing value for primary key ${String(key)}`);
      filterBuilder = filterBuilder.eq(key as string, value);
    }
    const query = loadQuery(opts);
    if (query) {
      const { selectQuery, userQueryPaths, paths } = query;
      const { data } = await filterBuilder
        .select(selectQuery)
        .throwOnError()
        .single();
      return buildMutationFetcherResponse<R>(data as R, {
        userQueryPaths,
        paths,
      });
    }
    await filterBuilder.throwOnError().single();
    return null;
  };
