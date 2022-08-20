import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import useMutation from "use-mutation";
import { PostgrestSWRMutatorOpts } from "../lib/types";
import { useSWRConfig } from "swr";
import { useCacheScanner, GenericTable, getTable } from "../lib";
import { buildUpdateMutator } from "@supabase-cache-helpers/postgrest-mutate";

function useUpdateMutation<Table extends GenericTable>(
  query: PostgrestQueryBuilder<Table>,
  primaryKeys: (keyof Table["Row"])[],
  opts?: PostgrestSWRMutatorOpts<Table, "Update">
) {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<Table, "Update">(getTable(query), opts);

  return useMutation<Table["Update"], Table["Row"], PostgrestError>(
    async (input: Table["Update"]) => {
      let filterBuilder = query.update(input);
      for (const key of primaryKeys) {
        const value = input[key];
        if (!value)
          throw new Error(`Missing value for primary key ${String(key)}`);
        filterBuilder = filterBuilder.eq(key as string, value);
      }
      const { data } = await filterBuilder.select("*").throwOnError().single();

      return data as Table["Row"];
    },
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        const data = params.data ?? params.input;
        const {
          keysToMutate,
          keysToRevalidateRelation,
          keysToRevalidateTable,
        } = scan();
        await Promise.all([
          ...keysToMutate
            .filter(({ filter }) => filter.apply(data as object))
            .map(({ key }) =>
              mutate(key, buildUpdateMutator(data, primaryKeys), opts)
            ),
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
        if (opts?.onSuccess) await opts.onSuccess(params);
      },
    }
  );
}

export { useUpdateMutation };
