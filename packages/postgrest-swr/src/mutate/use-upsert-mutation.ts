import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import useMutation, { MutationResult } from "use-mutation";
import { useSWRConfig } from "swr";
import { useCacheScanner, GenericTable, getTable, upsert } from "../lib";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildUpsertFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { UsePostgrestSWRMutationOpts } from "./types";

function useUpsertMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  mode: "single",
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<T, "UpsertOne", Q, R>
): MutationResult<T["Insert"], T["Row"], PostgrestError>;
function useUpsertMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  mode: "multiple",
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<T, "UpsertMany", Q, R>
): MutationResult<T["Insert"][], T["Row"][], PostgrestError>;
function useUpsertMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  mode: "single" | "multiple",
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<T, "UpsertOne" | "UpsertMany", Q, R>
): MutationResult<T["Insert"] | T["Insert"][], R | R[], PostgrestError> {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<T>(getTable(qb), opts);

  return useMutation<T["Insert"] | T["Insert"][], R | R[], PostgrestError>(
    buildUpsertFetcher(qb, mode, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        const keys = scan();
        const result = !Array.isArray(params.data)
          ? [params.data]
          : params.data;
        await upsert<T, Q, R>(result, primaryKeys, keys, mutate, opts);
        if (opts?.onSuccess) await opts.onSuccess(params as any);
      },
    }
  );
}

export { useUpsertMutation };
