import { buildUpdateFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { getTable } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestError, PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import {
  UseMutateAsyncFunction,
  UseMutateFunction,
  useMutation,
} from "@tanstack/react-query";
import { useCallback } from "react";

import { useUpsertItem } from "../cache";
import { useQueriesForTableLoader } from "../lib";
import { UsePostgrestMutationOpts } from "./types";

function useUpdateMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: (Q extends "*" ? "'*' is not allowed" : Q) | null,
  opts?: Omit<UsePostgrestMutationOpts<S, T, "UpdateOne", Q, R>, "mutationFn">
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  const { mutate, mutateAsync, data, ...rest } = useMutation({
    mutationFn: buildUpdateFetcher<S, T, Q, R>(qb, primaryKeys, {
      query: query ?? undefined,
      queriesForTable,
    }),
    ...opts,
    onSettled(data, error, variables, context) {
      if (opts?.onSettled) {
        opts.onSettled(data?.userQueryData, error, variables, context);
      }
    },
    async onSuccess(data, variables, context): Promise<void> {
      if (data) {
        await upsertItem(data.normalizedData as T["Row"]);
      }
      if (opts?.onSuccess)
        await opts.onSuccess(data?.userQueryData ?? null, variables, context);
    },
  });

  const mutateFn = useCallback<
    UseMutateFunction<R | null, PostgrestError, T["Update"]>
  >(
    (variables, options) =>
      mutate(variables, {
        ...options,
        onSettled(data, error, variables, context) {
          if (opts?.onSettled) {
            opts.onSettled(data?.userQueryData, error, variables, context);
          }
        },
        async onSuccess(data, variables, context): Promise<void> {
          if (data) {
            await upsertItem(data.normalizedData as T["Row"]);
          }
          if (opts?.onSuccess)
            await opts.onSuccess(
              data?.userQueryData ?? null,
              variables,
              context
            );
        },
      }),
    [opts, upsertItem]
  );

  const mutateAsyncFn = useCallback<
    UseMutateAsyncFunction<R | null, PostgrestError, T["Update"]>
  >(
    async (variables, options) => {
      const res = await mutateAsync(variables, {
        ...options,
        onSettled(data, error, variables, context) {
          if (opts?.onSettled) {
            opts.onSettled(data?.userQueryData, error, variables, context);
          }
        },
        async onSuccess(data, variables, context): Promise<void> {
          if (data) {
            await upsertItem(data.normalizedData as T["Row"]);
          }
          if (opts?.onSuccess)
            await opts.onSuccess(
              data?.userQueryData ?? null,
              variables,
              context
            );
        },
      });
      return res?.userQueryData ?? null;
    },
    [opts, upsertItem]
  );

  return {
    mutate: mutateFn,
    mutateAsync: mutateAsyncFn,
    data: data?.userQueryData ?? null,
    ...rest,
  };
}

export { useUpdateMutation };
