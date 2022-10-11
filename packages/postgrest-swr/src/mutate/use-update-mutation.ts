import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import useMutation from "use-mutation";
import { useSWRConfig } from "swr";
import { decode, getTable, usePostgrestFilterCache } from "../lib";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildUpdateFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { UsePostgrestSWRMutationOpts } from "./types";
import { GenericTable } from "@supabase-cache-helpers/postgrest-shared";
import { updateItem } from "@supabase-cache-helpers/postgrest-mutate";

function useUpdateMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<T, "UpdateOne", Q, R>
) {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return useMutation<T["Update"], R, PostgrestError>(
    buildUpdateFetcher(qb, primaryKeys, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        await updateItem(
          {
            input: params.data as Record<string, unknown>,
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
        );
        if (opts?.onSuccess) await opts.onSuccess(params);
      },
    }
  );
}

export { useUpdateMutation };
