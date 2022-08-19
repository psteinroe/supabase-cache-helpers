import { SupabaseQueryBuilder } from "@supabase/supabase-js/dist/module/lib/SupabaseQueryBuilder";
import { PostgrestError } from "@supabase/postgrest-js";
import { PostgrestSWRMutatorOpts } from "./types";
import { useSWRConfig } from "swr";
import { useCacheScanner } from "../lib";
import useMutation from "use-mutation";
import { buildDeleteMutator } from "@supabase-cache-helpers/postgrest-mutate";

function useDeleteMutation<
  Type,
  InputType extends Partial<Type> = Partial<Type>
>(
  query: SupabaseQueryBuilder<Type>,
  primaryKeys: (keyof Type)[],
  opts?: PostgrestSWRMutatorOpts<InputType, Type>
) {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<Type, InputType>(query["_table"], opts);

  return useMutation<InputType, Type, PostgrestError>(
    async (input: InputType) => {
      let filterBuilder = query.delete().select("*");
      for (const key of primaryKeys) {
        const value = input[key] as unknown as Type[keyof Type];
        if (!value)
          throw new Error(`Missing value for primary key ${String(key)}`);
        filterBuilder = filterBuilder.eq(key, value);
      }
      const { data } = await filterBuilder.throwOnError(true).single();
      return data as Type;
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
              mutate(key, buildDeleteMutator(data as Type, primaryKeys), opts)
            ),
          // set all entries of the specified table to stale
          ...keysToRevalidateTable.map(({ key }) => mutate(key)),
          // apply filter with relation.id.eq.obj.fkey and set all to stale
          ...keysToRevalidateRelation
            .filter(({ filter, fKeyColumn, relationIdColumn }) =>
              filter.applyFilters({
                [relationIdColumn]: data[fKeyColumn as keyof Type],
              })
            )
            .map(({ key }) => mutate(key)),
        ]);
        if (opts?.onSuccess) await opts.onSuccess(params);
      },
    }
  );
}

export { useDeleteMutation };
