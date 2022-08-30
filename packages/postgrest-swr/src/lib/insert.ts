import { buildInsertMutator } from "@supabase-cache-helpers/postgrest-mutate";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { MutatorOptions, ScopedMutator } from "swr/dist/types";
import { GenericTable } from "./types";
import { CacheScanResult } from "./use-cache-scanner";

export const insert = async <
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  result: R[],
  keys: CacheScanResult<T>,
  mutate: ScopedMutator,
  opts?: MutatorOptions<T>
) => {
  const { keysToMutate, keysToRevalidateTable, keysToRevalidateRelation } =
    keys;

  await Promise.all(
    result.map(async (d) => [
      ...keysToMutate
        .filter(({ filter }) => filter.apply(d))
        .map(({ key }) => mutate(key, buildInsertMutator(d), opts)),
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
