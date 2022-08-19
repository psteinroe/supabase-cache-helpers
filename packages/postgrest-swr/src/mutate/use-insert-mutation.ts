import { SupabaseQueryBuilder } from "@supabase/supabase-js/dist/module/lib/SupabaseQueryBuilder";
import useMutation from "use-mutation";
import { PostgrestError } from "@supabase/postgrest-js";
import { PostgrestSWRMutatorOpts } from "./types";
import { useCacheScanner } from "../lib";
import { useSWRConfig } from "swr";
import { buildInsertMutator } from "@supabase-cache-helpers/postgrest-mutate";

function useInsertMutation<
  Type,
  InputType extends Partial<Type> = Partial<Type>
>(
  query: SupabaseQueryBuilder<Type>,
  opts?: PostgrestSWRMutatorOpts<InputType, Type>
) {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<Type, InputType>(query["_table"], opts);

  return useMutation<InputType, Type, PostgrestError>(
    async (input: InputType) => {
      const { data } = await query
        .insert(input)
        .select("*")
        .throwOnError(true)
        .single();

      return data as Type;
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
                  [relationIdColumn]: data[fKeyColumn as keyof Type],
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
