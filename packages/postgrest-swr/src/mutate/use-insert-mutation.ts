import useMutation from "use-mutation";
import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import {
  useCacheScanner,
  GenericTable,
  PostgrestSWRMutatorOpts,
  getTable,
} from "../lib";
import { useSWRConfig } from "swr";
import { buildInsertMutator } from "@supabase-cache-helpers/postgrest-mutate";

function useInsertMutation<Table extends GenericTable>(
  query: PostgrestQueryBuilder<Table>,
  opts?: PostgrestSWRMutatorOpts<Table, "Insert">
) {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<Table, "Insert">(getTable(query), opts);

  return useMutation<Table["Insert"], Table["Row"], PostgrestError>(
    async (input: Table["Insert"]) => {
      const { data } = await query
        .insert(input)
        .select("*")
        .throwOnError()
        .single();

      return data as Table["Row"];
    },
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        try {
          const data = params.data ?? params.input;
          const {
            keysToMutate,
            keysToRevalidateRelation,
            keysToRevalidateTable,
          } = scan();
          await Promise.all([
            ...keysToMutate
              .filter(({ filter }) => filter.apply(data as object))
              .map(({ key }) => mutate(key, buildInsertMutator(data), opts)),
            // set all entries of the specified table to stale
            ...keysToRevalidateTable.map(({ key }) => mutate(key)),
            // apply filter with relation.id.eq.obj.fkey and set all to stale
            ...keysToRevalidateRelation
              .filter(({ filter, fKeyColumn, relationIdColumn }) =>
                filter.applyFilters({
                  [relationIdColumn]: data[fKeyColumn],
                })
              )
              .map(({ key }) => mutate(key)),
          ]);
        } catch (e) {
          console.error(e);
        }
        if (opts?.onSuccess) await opts.onSuccess(params);
      },
    }
  );
}

export { useInsertMutation };
