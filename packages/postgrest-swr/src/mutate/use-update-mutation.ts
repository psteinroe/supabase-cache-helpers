import { buildUpdateFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { getTable } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import useMutation from "use-mutation";

import { useUpsertItem } from "../cache";
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
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  return useMutation<T["Update"], R, PostgrestError>(
    buildUpdateFetcher(qb, primaryKeys, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        await upsertItem(params.data as T["Row"]);
        if (opts?.onSuccess) await opts.onSuccess(params);
      },
    }
  );
}

export { useUpdateMutation };
