import { buildDeleteMutator } from "@supabase-cache-helpers/postgrest-mutate";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { MutatorOptions, ScopedMutator } from "swr/dist/types";
import { GenericTable } from "./types";
import { CacheScanResult } from "./use-cache-scanner";

export const remove = async <
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
>(
  result: R,
  primaryKeys: (keyof T["Row"])[],
  keys: CacheScanResult<T>,
  mutate: ScopedMutator,
  opts?: MutatorOptions
) => {
  const { keysToMutate, keysToRevalidateTable, keysToRevalidateRelation } =
    keys;
  await Promise.all([
    ...keysToMutate
      .filter(({ filter }) => filter.apply(result))
      .map(({ key }) =>
        mutate(
          key,
          buildDeleteMutator<R>(result, primaryKeys as (keyof R)[]),
          opts
        )
      ),
    // set all entries of the specified table to stale
    ...keysToRevalidateTable.map(({ key }) => mutate(key)),
    // apply filter with relation.id.eq.obj.fkey and set all to stale
    ...keysToRevalidateRelation
      .filter(({ filter, fKeyColumn, relationIdColumn }) =>
        filter.applyFilters({
          [relationIdColumn]: result[fKeyColumn as keyof R],
        })
      )
      .map(({ key }) => mutate(key)),
  ]);
};
