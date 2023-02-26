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
  ) =>
  async (input: Partial<T["Row"]>) => {
    let filterBuilder = qb.delete();
    for (const key of primaryKeys) {
      const value = input[key];
      if (!value)
        throw new Error(`Missing value for primary key ${String(key)}`);
      filterBuilder = filterBuilder.eq(key as string, value);
    }
    const selectQuery = loadQuery(opts);
    if (selectQuery) {
      const { data } = await filterBuilder
        .select(selectQuery)
        .throwOnError()
        .single();
      return data as R;
    }
    const { data } = await filterBuilder.throwOnError().single();
    return data as R;
  };
