import { SupabaseQueryBuilder } from "@supabase/supabase-js/dist/module/lib/SupabaseQueryBuilder";
import useMutation, { Options } from "use-mutation";
import { PostgrestError } from "@supabase/postgrest-js";
import { PostgrestSWRMutatorOpts } from "./types";
import { useCacheScanner } from "./use-cache-scanner";
import { useSWRConfig } from "swr";
import { buildInsertMutator } from "@supabase-cache-helpers/postgrest-mutate";

function usePostgrestInsert<
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
      const { data } = await query.insert(input).throwOnError(true).single();

      return data as Type;
    },
    {
      ...opts,
      async onSuccess({ data, input }): Promise<void> {
        const {
          keysToMutate,
          keysToRevalidateRelation,
          keysToRevalidateTable,
        } = scan();
        await Promise.all([
          ...keysToMutate
            .filter(({ filter }) => filter.apply(input))
            .map(({ key }) => mutate(key, buildInsertMutator(input), opts)),
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
        if (opts?.onSuccess) await opts.onSuccess({ data, input });
      },
    }
  );
}

export { usePostgrestInsert };
