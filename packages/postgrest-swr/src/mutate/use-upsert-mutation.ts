import { buildUpsertFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { getTable } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import useMutation, { MutationResult } from "use-mutation";
import { useUpsertItem } from "../cache";

import { UsePostgrestSWRMutationOpts } from "./types";

function useUpsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  mode: "single",
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<S, T, "UpsertOne", Q, R>
): MutationResult<T["Insert"], T["Row"], PostgrestError>;
function useUpsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  mode: "multiple",
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<S, T, "UpsertMany", Q, R>
): MutationResult<T["Insert"][], T["Row"][], PostgrestError>;
function useUpsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  mode: "single" | "multiple",
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<S, T, "UpsertOne" | "UpsertMany", Q, R>
): MutationResult<T["Insert"] | T["Insert"][], R | R[], PostgrestError> {
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  return useMutation<T["Insert"] | T["Insert"][], R | R[], PostgrestError>(
    buildUpsertFetcher(qb, mode, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        const result = !Array.isArray(params.data)
          ? [params.data]
          : params.data;
        await Promise.all(
          result.map(async (r) => await upsertItem(r as T["Row"]))
        );
        if (opts?.onSuccess) await opts.onSuccess(params as any);
      },
    }
  );
}

export { useUpsertMutation };
