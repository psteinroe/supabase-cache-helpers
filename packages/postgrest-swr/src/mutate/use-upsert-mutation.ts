import {
  buildUpsertFetcher,
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

function useUpsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: (Q extends "*" ? "'*' is not allowed" : Q) | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, "Upsert", Q, R>
): MutationResult<T["Insert"][], R[] | null, PostgrestError> {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  const [update, state] = useMutation<
    T["Insert"][],
    MutationFetcherResponse<R>[] | null,
    PostgrestError
  >(
    buildUpsertFetcher<S, T, Q, R>(qb, {
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

  return [
    async (input: T["Insert"][]) => {
      const res = await update(input);
      return getUserResponse(res ?? null);
    },
    { ...state, data: getUserResponse(state.data ?? null) },
  ];
}

export { useUpsertMutation };
