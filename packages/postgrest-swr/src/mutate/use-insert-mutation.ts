import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import useMutation, { MutationResult } from "use-mutation";
import { useSWRConfig } from "swr";
import { decode, getTable, usePostgrestFilterCache } from "../lib";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildInsertFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { UsePostgrestSWRMutationOpts } from "./types";
import { upsertItem } from "@supabase-cache-helpers/postgrest-mutate";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";

function useInsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  mode: "single",
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<S, T, "InsertOne", Q, R>
): MutationResult<T["Insert"], T["Row"], PostgrestError>;
function useInsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  mode: "multiple",
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<S, T, "InsertMany", Q, R>
): MutationResult<T["Insert"][], T["Row"][], PostgrestError>;
function useInsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  mode: "single" | "multiple",
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<S, T, "InsertOne" | "InsertMany", Q, R>
): MutationResult<T["Insert"] | T["Insert"][], R | R[], PostgrestError> {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return useMutation<T["Insert"] | T["Insert"][], R | R[], PostgrestError>(
    buildInsertFetcher(qb, mode, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        const result = !Array.isArray(params.data)
          ? [params.data]
          : params.data;
        await Promise.all(
          result.map(
            async (r) =>
              await upsertItem(
                {
                  input: r as Record<string, unknown>,
                  primaryKeys,
                  table: getTable(qb),
                  schema: qb.schema as string,
                  opts,
                },
                {
                  cacheKeys: Array.from(cache.keys()),
                  getPostgrestFilter,
                  mutate,
                  decode,
                }
              )
          )
        );
        if (opts?.onSuccess) await opts.onSuccess(params as any);
      },
    }
  );
}

export { useInsertMutation };
