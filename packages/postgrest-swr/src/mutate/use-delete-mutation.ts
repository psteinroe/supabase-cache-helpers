import {
  buildDeleteFetcher,
  MutationFetcherResponse,
} from '@supabase-cache-helpers/postgrest-fetcher';
import { getTable } from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestError, PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import useMutation, { SWRMutationResponse } from 'swr/mutation';

import { useDeleteItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { UsePostgrestSWRMutationOpts } from './types';
import { useRandomKey } from './use-random-key';

function useDeleteMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T['Row'])[],
  query?: (Q extends '*' ? "'*' is not allowed" : Q) | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, 'DeleteOne', Q, R>
): SWRMutationResponse<R, PostgrestError, Partial<T['Row']>> {
  const key = useRandomKey();
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const deleteItem = useDeleteItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  const { trigger, data, ...rest } = useMutation<
    MutationFetcherResponse<R> | null,
    PostgrestError,
    string,
    Partial<T['Row']>
  >(
    key,
    (_, { arg }) =>
      buildDeleteFetcher<S, T, Q, R>(qb, primaryKeys, {
        query: query ?? undefined,
        queriesForTable,
        disabled: opts?.disableAutoQuery,
      })(arg),
    {
      ...opts,
      onError: (err, key) => {
        if (opts?.onError) opts.onError(err, key, opts);
      },
      onSuccess(result, key) {
        if (result) {
          deleteItem(result?.normalizedData as T['Row']);
        }
        if (opts?.onSuccess)
          opts.onSuccess(result?.userQueryData ?? null, key, opts);
      },
    }
  );

  return {
    trigger: async (input: Partial<T['Row']> | undefined) => {
      const res = await trigger(input);
      return res?.userQueryData;
    },
    data: data?.userQueryData ?? undefined,
    ...rest,
  };
}

export { useDeleteMutation };
