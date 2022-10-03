import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { useSWRConfig } from "swr";
import useMutation from "use-mutation";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildDeleteFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { UsePostgrestSWRMutationOpts } from "./types";
import {
  DEFAULT_SCHEMA_NAME,
  GenericTable,
} from "@supabase-cache-helpers/postgrest-shared";
import { usePostgrestFilterCache } from "../lib/use-postgrest-filter-cache";
import { deleteItem } from "@supabase-cache-helpers/postgrest-mutate";
import { decode, getCacheKeys, getTable } from "../lib";

function useDeleteMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<T, "DeleteOne", Q, R>
) {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return useMutation<Partial<T["Row"]>, R, PostgrestError>(
    buildDeleteFetcher(qb, primaryKeys, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        await deleteItem(
          {
            input: params.data as Record<string, unknown>,
            primaryKeys,
            table: getTable(qb),
            schema: qb.schema ?? DEFAULT_SCHEMA_NAME,
            opts,
          },
          { cacheKeys: getCacheKeys(cache), getPostgrestFilter, mutate, decode }
        );
        if (opts?.onSuccess) await opts.onSuccess(params);
      },
    }
  );
}

export { useDeleteMutation };
