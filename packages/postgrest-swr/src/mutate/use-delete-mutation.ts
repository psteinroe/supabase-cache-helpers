import {
  buildDeleteFetcher,
  MutationFetcherResponse,
} from "@supabase-cache-helpers/postgrest-fetcher";
import { getTable } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import useMutation, { MutationResult } from "use-mutation";
import { useDeleteItem } from "../cache";
import { useQueriesForTableLoader } from "../lib";
import { getUserResponse } from "./get-user-response";

import { UsePostgrestSWRMutationOpts } from "./types";

function useDeleteMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: (Q extends "*" ? "'*' is not allowed" : Q) | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, "DeleteOne", Q, R>
): MutationResult<Partial<T["Row"]>, R | null, PostgrestError> {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const deleteItem = useDeleteItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  const [remove, state] = useMutation<
    Partial<T["Row"]>,
    MutationFetcherResponse<R> | null,
    PostgrestError
  >(
    buildDeleteFetcher<S, T, Q, R>(qb, primaryKeys, {
      query: query ?? undefined,
      queriesForTable,
    }),
    {
      ...opts,
      onSettled(params) {
        if (opts?.onSettled)
          if (params.status === "success") {
            opts.onSettled({
              ...params,
              data: params.data?.userQueryData ?? null,
            });
          } else if (params.status === "failure") {
            opts.onSettled(params);
          }
      },
      async onSuccess(params): Promise<void> {
        await deleteItem(params.input);
        if (opts?.onSuccess)
          await opts.onSuccess({
            input: params.input,
            data: params.data?.userQueryData ?? null,
          });
      },
    }
  );

  return [
    async (input: Partial<T["Row"]>) => {
      const res = await remove(input);
      return res?.userQueryData ?? null;
    },
    { ...state, data: state.data?.userQueryData ?? null },
  ];
}

export { useDeleteMutation };
