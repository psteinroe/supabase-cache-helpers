import { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";

export type DeleteFetcher<T extends GenericTable, R> = (
  input: Partial<T["Row"]>
) => Promise<R | null>;

export const buildDeleteFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    Q extends string = "*",
    R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
  >(
    qb: PostgrestQueryBuilder<S, T>,
    primaryKeys: (keyof T["Row"])[],
    query?: (Q extends "*" ? "'*' is not allowed" : Q) | null
  ): DeleteFetcher<T, R> =>
  async (input: Partial<T["Row"]>): Promise<R | null> => {
    let filterBuilder = qb.delete();
    for (const key of primaryKeys) {
      const value = input[key];
      if (!value)
        throw new Error(`Missing value for primary key ${String(key)}`);
      filterBuilder = filterBuilder.eq(key as string, value);
    }
    if (query) {
      const { data } = await filterBuilder
        .select(query)
        .throwOnError()
        .single();
      return data as R;
    }
    await filterBuilder.throwOnError().single();
    return null;
  };
