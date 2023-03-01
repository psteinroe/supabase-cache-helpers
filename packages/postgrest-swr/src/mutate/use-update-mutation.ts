import {
  buildUpdateFetcher,
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

import { useUpsertItem } from "../cache";
import { useQueriesForTableLoader } from "../lib";
import { UsePostgrestSWRMutationOpts } from "./types";

function useUpdateMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: (Q extends "*" ? "'*' is not allowed" : Q) | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, "UpdateOne", Q, R>
): MutationResult<T["Update"], R | null, PostgrestError> {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  const [update, state] = useMutation<
    T["Update"],
    MutationFetcherResponse<R> | null,
    PostgrestError
  >(
    buildUpdateFetcher<S, T, Q, R>(qb, primaryKeys, {
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
        await upsertItem(params.data?.normalizedData as T["Row"]);
        if (opts?.onSuccess)
          await opts.onSuccess({
            input: params.input,
            data: params.data?.userQueryData ?? null,
          });
      },
    }
  );

  return [
    async (input: T["Update"]) => {
      const res = await update(input);
      return res?.userQueryData ?? null;
    },
    { ...state, data: state.data?.userQueryData ?? null },
  ];
}

export { useUpdateMutation };
