import { buildInsertFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { PostgrestFilter } from "@supabase-cache-helpers/postgrest-filter";
import { getTable } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import { useSWRConfig } from "swr";
import useMutation, { MutationResult } from "use-mutation";

import { useUpsertItem } from "../cache";
import { decode, usePostgrestFilterCache } from "../lib";
import { UsePostgrestSWRMutationOpts } from "./types";

function useInsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: UsePostgrestSWRMutationOpts<S, T, "Insert", Q, R>
): MutationResult<T["Insert"][], R[], PostgrestError> {
  const getPostgrestFilter = usePostgrestFilterCache();
  const { cache } = useSWRConfig();
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  return useMutation<T["Insert"][], R[], PostgrestError>(
    buildInsertFetcher<S, T, Q, R>(qb, {
      q: query,
      parsersForTable: () =>
        Array.from(cache.keys()).reduce((prev, curr) => {
          const decodedKey = decode(curr);
          if (decodedKey?.table === getTable(qb)) {
            prev.push(getPostgrestFilter(decodedKey.queryKey));
          }
          return prev;
        }, []),
    }),
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

export { useInsertMutation };
