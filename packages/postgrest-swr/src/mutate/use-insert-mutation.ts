import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import useMutation, { MutationResult } from "use-mutation";
import { useSWRConfig } from "swr";
import { useCacheScanner, getTable, insert } from "../lib";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildInsertFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { UsePostgrestSWRMutationOpts } from "./types";
import { GenericTable } from "@supabase-cache-helpers/postgrest-shared";

function useInsertMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  mode: "single",
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<T, "InsertOne", Q, R>
): MutationResult<T["Insert"], T["Row"], PostgrestError>;
function useInsertMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  mode: "multiple",
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<T, "InsertMany", Q, R>
): MutationResult<T["Insert"][], T["Row"][], PostgrestError>;
function useInsertMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  mode: "single" | "multiple",
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<T, "InsertOne" | "InsertMany", Q, R>
): MutationResult<T["Insert"] | T["Insert"][], R | R[], PostgrestError> {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<T>(getTable(qb), opts);

  return useMutation<T["Insert"] | T["Insert"][], R | R[], PostgrestError>(
    buildInsertFetcher(qb, mode, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        const keys = scan();
        const result = !Array.isArray(params.data)
          ? [params.data]
          : params.data;
        await insert<T, Q, R>(result, keys, mutate, opts);
        if (opts?.onSuccess) await opts.onSuccess(params as any);
      },
    }
  );
}

export { useInsertMutation };
