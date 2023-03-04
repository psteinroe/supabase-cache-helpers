import { buildDeleteFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { getTable } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import { useMutation } from "@tanstack/react-query";

import { useDeleteItem } from "../cache";
import { UsePostgrestMutationOpts } from "./types";

function useDeleteMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: (Q extends "*" ? "'*' is not allowed" : Q) | null,
  opts?: Omit<UsePostgrestMutationOpts<S, T, "DeleteOne", Q, R>, "mutationFn">
) {
  const deleteItem = useDeleteItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  return useMutation({
    mutationFn: buildDeleteFetcher<S, T, Q, R>(qb, primaryKeys, query),
    ...opts,
    async onSuccess(data, variables, context): Promise<void> {
      await deleteItem(variables);
      if (opts?.onSuccess)
        await opts.onSuccess(data ?? null, variables, context);
    },
  });
}

export { useDeleteMutation };
