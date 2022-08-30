import { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { GenericTable } from "@supabase/postgrest-js/dist/module/types";

export const buildDeleteFetcher =
  <
    T extends GenericTable,
    Q extends string = "*",
    R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
  >(
    qb: PostgrestQueryBuilder<T>,
    primaryKeys: (keyof T["Row"])[],
    query?: Q
  ) =>
  async (input: Partial<T["Row"]>) => {
    let filterBuilder = qb.delete();
    for (const key of primaryKeys) {
      const value = input[key];
      if (!value)
        throw new Error(`Missing value for primary key ${String(key)}`);
      filterBuilder = filterBuilder.eq(key as string, value);
    }
    const { data } = await filterBuilder
      .select(query ?? "*")
      .throwOnError()
      .single();
    return data as R;
  };
