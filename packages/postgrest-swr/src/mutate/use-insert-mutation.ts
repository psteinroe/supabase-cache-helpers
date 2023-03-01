import { buildInsertFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { getTable } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
    GenericSchema,
    GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import useMutation, { MutationResult } from "use-mutation";

import { useUpsertItem } from "../cache";
import { useQueriesForTableLoader } from "../lib";
import { UsePostgrestSWRMutationOpts } from "./types";

function useInsertMutation<
    S extends GenericSchema,
    T extends GenericTable,
    Q extends string = "*",
    R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
    qb: PostgrestQueryBuilder<S, T>,
    primaryKeys: (keyof T["Row"])[],
    query?: (Q extends "*" ? "'*' is not allowed" : Q) | null,
    opts?: UsePostgrestSWRMutationOpts<S, T, "Insert", Q, R>
): MutationResult<T["Insert"][], R[], PostgrestError> {
    const queriesForTable = useQueriesForTableLoader(getTable(qb));
    const upsertItem = useUpsertItem({
        primaryKeys,
        table: getTable(qb),
        schema: qb.schema as string,
        opts,
    });

    const [insert, state] = useMutation<T["Insert"][], R[], PostgrestError>(
        buildInsertFetcher<S, T, Q, R>(qb, {
            query: query ?? undefined,
            queriesForTable,
        }),
        {
            ...opts,
            async onSuccess(params): Promise<void> {
                const result = !Array.isArray(params.data)
                    ? [params.data]
                    : params.data;
                await Promise.all(
                    result.map(async (r) => await upsertItem(r as T["Row"]))
                );
                if (opts?.onSuccess) await opts.onSuccess(params as any);
            },
        }
    );

    const insertWrapper = async (input: T["Insert"][]) => {
        const res = await insert(input);
        return res;
    };

    return [insertWrapper, state];
}

export { useInsertMutation };
