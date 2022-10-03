import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import useMutation, { MutationResult } from "use-mutation";
import { Key, useSWRConfig } from "swr";
import {
  decode,
  getCacheKeys,
  getTable,
  usePostgrestFilterCache,
} from "../lib";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildUpsertFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { UsePostgrestSWRMutationOpts } from "./types";
import {
  DEFAULT_SCHEMA_NAME,
  GenericTable,
} from "@supabase-cache-helpers/postgrest-shared";
import { upsertItem } from "@supabase-cache-helpers/postgrest-mutate";

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
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return useMutation<T["Insert"] | T["Insert"][], R | R[], PostgrestError>(
    buildUpsertFetcher(qb, mode, query),
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
                  input: params.data as Record<string, unknown>,
                  primaryKeys,
                  table: getTable(qb),
                  schema: qb.schema ?? DEFAULT_SCHEMA_NAME,
                  opts,
                },
                {
                  cacheKeys: getCacheKeys(cache),
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

export { useUpsertMutation };
