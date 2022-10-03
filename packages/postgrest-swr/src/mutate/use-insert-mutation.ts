import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import useMutation, { MutationResult } from "use-mutation";
import { useSWRConfig } from "swr";
import {
  decode,
  getCacheKeys,
  getTable,
  usePostgrestFilterCache,
} from "../lib";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildInsertFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { UsePostgrestSWRMutationOpts } from "./types";
import {
  DEFAULT_SCHEMA_NAME,
  GenericTable,
} from "@supabase-cache-helpers/postgrest-shared";
import { insertItem } from "@supabase-cache-helpers/postgrest-mutate";

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
              await insertItem(
                {
                  input: r as Record<string, unknown>,
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

export { useInsertMutation };
