import {
  buildUpdateFetcher,
  getTable,
} from "@supabase-cache-helpers/postgrest-core";
import type { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import type { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import type {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import { useMutation } from "@tanstack/react-query";

import { useUpsertItem } from "../cache";
import { useQueriesForTableLoader } from "../lib";
import type { UsePostgrestMutationOpts } from "./types";

/**
 * Hook to execute a UPDATE mutation
 *
 * @param {PostgrestQueryBuilder<S, T>} qb PostgrestQueryBuilder instance for the table
 * @param {Array<keyof T['Row']>} primaryKeys Array of primary keys of the table
 * @param {string | null} query Optional PostgREST query string for the UPDATE mutation
 * @param {Omit<UsePostgrestMutationOpts<S, T, 'UpdateOne', Q, R>, 'mutationFn'>} [opts] Options to configure the hook
 */
function useUpdateMutation<
  S extends GenericSchema,
  T extends GenericTable,
  RelationName,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = "*",
  R = GetResult<S, T["Row"], RelationName, Re, Q extends "*" ? "*" : Q>,
>(
  qb: PostgrestQueryBuilder<S, T, Re>,
  primaryKeys: (keyof T["Row"])[],
  query?: Q | null,
  opts?: Omit<
    UsePostgrestMutationOpts<S, T, RelationName, Re, "UpdateOne", Q, R>,
    "mutationFn"
  >,
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input) => {
      const result = await buildUpdateFetcher<S, T, RelationName, Re, Q, R>(
        qb,
        primaryKeys,
        {
          query: query ?? undefined,
          queriesForTable,
          disabled: opts?.disableAutoQuery,
          ...opts,
        },
      )(input);
      if (result) {
        await upsertItem(result.normalizedData as T["Row"]);
      }
      return result?.userQueryData ?? null;
    },
    ...opts,
  });
}

export { useUpdateMutation };
