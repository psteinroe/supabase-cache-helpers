import { buildUpsertMutator } from "@supabase-cache-helpers/postgrest-mutate";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { MutatorOptions, ScopedMutator } from "swr/dist/types";
import { GenericTable } from "@supabase-cache-helpers/postgrest-shared";
import { CacheScanResult } from "./use-cache-scanner";

export const upsert = async <
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  result: R[],
  primaryKeys: (keyof T["Row"])[],
  keys: CacheScanResult<T>,
  mutate: ScopedMutator,
  opts?: MutatorOptions
) => {
  const { keysToMutate, keysToRevalidateTable, keysToRevalidateRelation } =
    keys;
  await Promise.all(
    result.map(async (d) => [
      ...keysToMutate
        .filter(({ filter }) => filter.apply(d))
        .map(({ key, filter }) =>
          mutate(
            key,
            buildUpsertMutator(
              d as Record<string, unknown>,
              primaryKeys,
              filter
            ),
            opts
          )
        ),
      // set all entries of the specified table to stale
      ...keysToRevalidateTable.map(({ key }) => mutate(key)),
      // apply filter with relation.id.eq.obj.fkey and set all to stale
      ...keysToRevalidateRelation
        .filter(({ filter, fKeyColumn, relationIdColumn }) =>
          filter.applyFilters({
            [relationIdColumn]: d[fKeyColumn as keyof R],
          })
        )
        .map(({ key }) => mutate(key)),
    ])
  );
};
