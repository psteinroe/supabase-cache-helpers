import { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { GenericTable } from "@supabase/postgrest-js/dist/module/types";
import { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";

export const buildUpsertFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    Q extends string = "*",
    R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
  >(
    qb: PostgrestQueryBuilder<S, T>,
    mode: "single" | "multiple",
    query?: Q
  ) =>
  async (input: T["Insert"] | T["Insert"][]) => {
    if (!Array.isArray(input)) input = [input];
    const filterBuilder = qb
      .upsert(input as any) // todo fix type
      .throwOnError()
      .select(query ?? "*");

    if (mode === "single") {
      const { data } = await filterBuilder.single();
      return data as R;
    } else {
      const { data } = await filterBuilder;
      return data as R[];
    }
  };
