import { SupabaseQueryBuilder } from "@supabase/supabase-js/dist/module/lib/SupabaseQueryBuilder";
import { PostgrestError, PostgrestFilterBuilder } from "@supabase/postgrest-js";
import useMutation from "use-mutation";
import { PostgrestSWRMutatorOpts } from "./types";
import { useSWRConfig } from "swr";
import { useCacheScanner } from "../lib";
import { buildUpdateMutator } from "@supabase-cache-helpers/postgrest-mutate";

function useUpdateMutation<
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
      let filterBuilder: PostgrestFilterBuilder<Type> = query
        .update(input)
        .select("*");
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
              mutate(key, buildUpdateMutator(data as Type, primaryKeys), opts)
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

export { useUpdateMutation };
