import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { useSWRConfig } from "swr";
import {
  useCacheScanner,
  GenericTable,
  PostgrestSWRMutatorOpts,
  getTable,
  remove,
} from "../lib";
import useMutation from "use-mutation";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { buildDeleteFetcher } from "@supabase-cache-helpers/postgrest-fetcher";

function useDeleteMutation<
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<T>,
  primaryKeys: (keyof T["Row"])[],
  query?: Q,
  opts?: PostgrestSWRMutatorOpts<T, "DeleteOne", Q, R>
) {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<T, "DeleteOne">(getTable(qb), opts);

  return useMutation<Partial<T["Row"]>, R, PostgrestError>(
    buildDeleteFetcher(qb, primaryKeys, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        const keys = scan();
        await remove<T, Q, R>(params.data, primaryKeys, keys, mutate, opts);
        if (opts?.onSuccess) await opts.onSuccess(params);
      },
    }
  );
}

export { useDeleteMutation };