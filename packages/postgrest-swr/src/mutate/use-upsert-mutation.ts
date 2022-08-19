import { SupabaseQueryBuilder } from "@supabase/supabase-js/dist/module/lib/SupabaseQueryBuilder";
import { PostgrestError, PostgrestFilterBuilder } from "@supabase/postgrest-js";
import useMutation, { MutationResult } from "use-mutation";
import { PostgrestSWRMutatorOpts } from "./types";
import { useSWRConfig } from "swr";
import { useCacheScanner } from "../lib";
import { buildUpsertMutator } from "@supabase-cache-helpers/postgrest-mutate";
import { filter } from "lodash";

function useUpsertMutation<
  Type,
  InputType extends Partial<Type> = Partial<Type>
>(
  query: SupabaseQueryBuilder<Type>,
  mode: "single",
  primaryKeys: (keyof Type)[],
  opts?: PostgrestSWRMutatorOpts<InputType, Type>
): MutationResult<InputType, Type, PostgrestError>;
function useUpsertMutation<
  Type,
  InputType extends Partial<Type> = Partial<Type>
>(
  query: SupabaseQueryBuilder<Type>,
  mode: "multiple",
  primaryKeys: (keyof Type)[],
  opts?: PostgrestSWRMutatorOpts<InputType, Type>
): MutationResult<InputType[], Type[], PostgrestError>;
function useUpsertMutation<
  Type,
  InputType extends Partial<Type> = Partial<Type>
>(
  query: SupabaseQueryBuilder<Type>,
  mode: "single" | "multiple",
  primaryKeys: (keyof Type)[],
  opts?: PostgrestSWRMutatorOpts<InputType, Type>
): MutationResult<InputType | InputType[], Type | Type[], PostgrestError> {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<Type, InputType>(query["_table"], opts);

  return useMutation<InputType | InputType[], Type | Type[], PostgrestError>(
    async (input: InputType | InputType[]) => {
      if (!Array.isArray(input)) input = [input];
      const filterBuilder: PostgrestFilterBuilder<Type> = query
        .throwOnError(true)
        .upsert(input)
        .select("*");

      if (mode === "single") {
        const { data } = await filterBuilder.single();
        return data as Type;
      } else {
        const { data } = await filterBuilder;
        return data as Type[];
      }
    },
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        const {
          keysToMutate,
          keysToRevalidateRelation,
          keysToRevalidateTable,
        } = scan();
        const data = !Array.isArray(params.data) ? [params.data] : params.data;
        const input = !Array.isArray(params.input)
          ? [params.input]
          : params.input;

        await Promise.all(
          data.map(async (d) => {
            const data =
              d ??
              (input.find((i) =>
                primaryKeys.every(
                  (pk) => i[pk] === (d[pk] as unknown as InputType[keyof Type])
                )
              ) as InputType);
            return [
              ...keysToMutate
                .filter(({ filter }) => filter.apply(data as object))
                .map(({ key, filter }) =>
                  mutate(
                    key,
                    buildUpsertMutator<any>(data as object, primaryKeys, (i) =>
                      filter.hasPaths(i)
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
                    [relationIdColumn]: data[fKeyColumn as keyof Type],
                  })
                )
                .map(({ key }) => mutate(key)),
            ];
          })
        );
        if (opts?.onSuccess) await opts.onSuccess(params as any);
      },
    }
  );
}

export { useUpsertMutation };
