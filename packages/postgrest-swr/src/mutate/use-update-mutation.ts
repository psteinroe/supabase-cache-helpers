import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import useMutation from "use-mutation";
import { PostgrestSWRMutatorOpts } from "../lib/types";
import { useSWRConfig } from "swr";
import { useCacheScanner, GenericTable, getTable, update } from "../lib";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildUpdateFetcher } from "@supabase-cache-helpers/postgrest-fetcher";

function useUpdateMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: PostgrestSWRMutatorOpts<T, "UpdateOne", Q, R>
) {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<T, "UpdateOne">(getTable(qb), opts);

  return useMutation<T["Update"], R, PostgrestError>(
    buildUpdateFetcher(qb, primaryKeys, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        const keys = scan();
        await update<T, Q, R>(params.data, primaryKeys, keys, mutate, opts);
        if (opts?.onSuccess) await opts.onSuccess(params);
      },
    }
  );
}

export { useUpdateMutation };
