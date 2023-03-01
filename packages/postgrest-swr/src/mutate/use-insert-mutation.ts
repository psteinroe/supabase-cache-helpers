import {
  buildInsertFetcher,
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
import { getUserResponse } from "./get-user-response";
import { UsePostgrestSWRMutationOpts } from "./types";

function useInsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: (Q extends "*" ? "'*' is not allowed" : Q) | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, "Insert", Q, R>
): MutationResult<T["Insert"][], R[] | null, PostgrestError> {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  const [insert, state] = useMutation<
    T["Insert"][],
    MutationFetcherResponse<R>[] | null,
    PostgrestError
  >(
    buildInsertFetcher<S, T, Q, R>(qb, {
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
              data: getUserResponse(params.data),
            });
          } else if (params.status === "failure") {
            opts.onSettled(params);
          }
      },
      async onSuccess(params): Promise<void> {
        if (params.data) {
          await Promise.all(
            (params.data ?? []).map(
              async (d) => await upsertItem(d.normalizedData as T["Row"])
            )
          );
        }
        if (opts?.onSuccess)
          await opts.onSuccess({
            input: params.input,
            data: getUserResponse(params.data),
          });
      },
    }
  );

  return [
    async (input: T["Insert"][]) => {
      const res = await insert(input);
      return getUserResponse(res ?? null);
    },
    { ...state, data: getUserResponse(state.data ?? null) },
  ];
}

export { useInsertMutation };
