import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import useMutation, { MutationResult } from "use-mutation";
import { useSWRConfig } from "swr";
import {
  useCacheScanner,
  PostgrestSWRMutatorOpts,
  GenericTable,
  getTable,
} from "../lib";
import { buildUpsertMutator } from "@supabase-cache-helpers/postgrest-mutate";

function useUpsertMutation<Table extends GenericTable>(
  query: PostgrestQueryBuilder<Table>,
  mode: "single",
  primaryKeys: (keyof Table["Row"])[],
  opts?: PostgrestSWRMutatorOpts<Table, "Insert">
): MutationResult<Table["Insert"], Table["Row"], PostgrestError>;
function useUpsertMutation<Table extends GenericTable>(
  query: PostgrestQueryBuilder<Table>,
  mode: "multiple",
  primaryKeys: (keyof Table["Row"])[],
  opts?: PostgrestSWRMutatorOpts<Table, "Insert">
): MutationResult<Table["Insert"][], Table["Row"][], PostgrestError>;
function useUpsertMutation<Table extends GenericTable>(
  query: PostgrestQueryBuilder<Table>,
  mode: "single" | "multiple",
  primaryKeys: (keyof Table["Row"])[],
  opts?: PostgrestSWRMutatorOpts<Table, "Insert">
): MutationResult<
  Table["Insert"] | Table["Insert"][],
  Table["Row"] | Table["Row"][],
  PostgrestError
> {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner<Table, "Insert">(getTable(query), opts);

  return useMutation<
    Table["Insert"] | Table["Insert"][],
    Table["Row"] | Table["Row"][],
    PostgrestError
  >(
    async (input: Table["Insert"] | Table["Insert"][]) => {
      if (!Array.isArray(input)) input = [input];
      const filterBuilder = query.upsert(input).throwOnError().select("*");

      if (mode === "single") {
        const { data } = await filterBuilder.single();
        return data as Table["Row"];
      } else {
        const { data } = await filterBuilder;
        return data as Table["Row"][];
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
              input.find((i) => primaryKeys.every((pk) => i[pk] === d[pk]));
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
                    [relationIdColumn]: data[fKeyColumn],
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
