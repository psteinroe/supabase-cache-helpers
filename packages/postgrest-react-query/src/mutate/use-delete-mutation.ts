import { buildDeleteFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import { getTable } from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
  PostgrestError,
} from '@supabase/postgrest-js/dist/module/types';
import {
  UseMutateAsyncFunction,
  UseMutateFunction,
  useMutation,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { useDeleteItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { UsePostgrestMutationOpts } from './types';

function useDeleteMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T['Row'])[],
  query?: (Q extends '*' ? "'*' is not allowed" : Q) | null,
  opts?: Omit<UsePostgrestMutationOpts<S, T, 'DeleteOne', Q, R>, 'mutationFn'>
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const deleteItem = useDeleteItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  const { mutate, mutateAsync, data, ...rest } = useMutation({
    mutationFn: buildDeleteFetcher<S, T, Q, R>(qb, primaryKeys, {
      query: query ?? undefined,
      queriesForTable,
      disabled: opts?.disableAutoQuery,
    }),
    ...opts,
    onSettled(data, error, variables, context) {
      if (opts?.onSettled) {
        opts.onSettled(data?.userQueryData, error, variables, context);
      }
    },
    async onSuccess(data, variables, context): Promise<void> {
      if (data) {
        await deleteItem(data.normalizedData as T['Row']);
      }
      if (opts?.onSuccess)
        await opts.onSuccess(data?.userQueryData ?? null, variables, context);
    },
  });

  const mutateFn = useCallback<
    UseMutateFunction<R | null, PostgrestError, T['Update']>
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
            await deleteItem(data.normalizedData as T['Row']);
          }
          if (opts?.onSuccess)
            await opts.onSuccess(
              data?.userQueryData ?? null,
              variables,
              context
            );
        },
      }),
    [opts, deleteItem]
  );

  const mutateAsyncFn = useCallback<
    UseMutateAsyncFunction<R | null, PostgrestError, T['Update']>
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
            await deleteItem(data.normalizedData as T['Row']);
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
    [opts, deleteItem]
  );

  return {
    mutate: mutateFn,
    mutateAsync: mutateAsyncFn,
    data: data?.userQueryData ?? null,
    ...rest,
  };
}

export { useDeleteMutation };
