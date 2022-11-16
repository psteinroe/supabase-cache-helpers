import { buildUpdateFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { upsertItem } from "@supabase-cache-helpers/postgrest-mutate";
import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import { useSWRConfig } from "swr";
import useMutation from "use-mutation";

import { decode, getTable, usePostgrestFilterCache } from "../lib";
import { UsePostgrestSWRMutationOpts } from "./types";

function useUpdateMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<S, T, "UpdateOne", Q, R>
) {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();

  return useMutation<T["Update"], R, PostgrestError>(
    buildUpdateFetcher(qb, primaryKeys, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        await upsertItem(
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
