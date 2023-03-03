import {
  buildInsertFetcher,
  MutationFetcherResponse,
} from "@supabase-cache-helpers/postgrest-fetcher";
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
import { getUserResponse } from "./get-user-response";
import { UsePostgrestMutationOpts } from "./types";

function useInsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T["Row"])[],
  query?: (Q extends "*" ? "'*' is not allowed" : Q) | null,
  opts?: Omit<UsePostgrestMutationOpts<S, T, "Insert", Q, R>, "mutationFn">
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  const { mutate, mutateAsync, data, ...rest } = useMutation<
    MutationFetcherResponse<R>[] | null,
    PostgrestError,
    T["Insert"][]
  >({
    mutationFn: buildInsertFetcher<S, T, Q, R>(qb, {
      query: query ?? undefined,
      queriesForTable,
    }),
    ...opts,
    onSettled(data, error, variables, context) {
      if (opts?.onSettled) {
        opts.onSettled(getUserResponse(data), error, variables, context);
      }
    },
    async onSuccess(data, variables, context): Promise<void> {
      if (data) {
        await Promise.all(
          data.map(async (d) => await upsertItem(d.normalizedData as T["Row"]))
        );
      }
      if (opts?.onSuccess)
        await opts.onSuccess(getUserResponse(data) ?? null, variables, context);
    },
  });

  const mutateFn = useCallback<
    UseMutateFunction<R[] | null, PostgrestError, T["Insert"][]>
  >(
    (variables, options) =>
      mutate(variables, {
        ...options,
        onSettled(data, error, variables, context) {
          if (opts?.onSettled) {
            opts.onSettled(getUserResponse(data), error, variables, context);
          }
        },
        async onSuccess(data, variables, context): Promise<void> {
          if (data) {
            await Promise.all(
              data.map(
                async (d) => await upsertItem(d.normalizedData as T["Row"])
              )
            );
          }
          if (opts?.onSuccess)
            await opts.onSuccess(
              getUserResponse(data) ?? null,
              variables,
              context
            );
        },
      }),
    [opts, upsertItem]
  );

  const mutateAsyncFn = useCallback<
    UseMutateAsyncFunction<R[] | null, PostgrestError, T["Insert"][]>
  >(
    async (variables, options) => {
      const res = await mutateAsync(variables, {
        ...options,
        onSettled(data, error, variables, context) {
          if (opts?.onSettled) {
            opts.onSettled(getUserResponse(data), error, variables, context);
          }
        },
        async onSuccess(data, variables, context): Promise<void> {
          if (data) {
            await Promise.all(
              data.map(
                async (d) => await upsertItem(d.normalizedData as T["Row"])
              )
            );
          }
          if (opts?.onSuccess)
            await opts.onSuccess(
              getUserResponse(data) ?? null,
              variables,
              context
            );
        },
      });
      return getUserResponse(res ?? null) ?? null;
    },
    [opts, upsertItem]
  );

  return {
    mutate: mutateFn,
    mutateAsync: mutateAsyncFn,
    data: getUserResponse(data) ?? null,
    ...rest,
  };
}

export { useInsertMutation };
