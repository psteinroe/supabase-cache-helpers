import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { useSWRConfig } from "swr";
import useMutation from "use-mutation";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildDeleteFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { UsePostgrestSWRMutationOpts } from "./types";
import { usePostgrestFilterCache } from "../lib/use-postgrest-filter-cache";
import { deleteItem } from "@supabase-cache-helpers/postgrest-mutate";
import { decode, getTable } from "../lib";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";

function useDeleteMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<S, T, "DeleteOne", Q, R>
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

export { useDeleteMutation };
