import { PostgrestError, PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import {
  buildDeleteFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import useMutation, { SWRMutationResponse } from 'swr/mutation';

import { UsePostgrestSWRMutationOpts } from './types';
import { useRandomKey } from './use-random-key';
import { useDeleteItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';

/**
 * Hook for performing a DELETE mutation on a PostgREST resource.
 *
 * @param qb - The PostgrestQueryBuilder instance for the resource.
 * @param primaryKeys - An array of primary key column names for the table.
 * @param query - An optional query string.
 * @param opts - An optional object of options to configure the mutation.
 * @returns A SWRMutationResponse object containing the mutation response data, error, and mutation function.
 */
function useDeleteMutation<
  S extends GenericSchema,
  T extends GenericTable,
  RelationName,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q>,
>(
  qb: PostgrestQueryBuilder<S, T, Re>,
  primaryKeys: (keyof T['Row'])[],
  query?: Q | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, RelationName, Re, 'DeleteOne', Q, R>,
): SWRMutationResponse<R | null, PostgrestError, string, Partial<T['Row']>> {
  const key = useRandomKey();
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const deleteItem = useDeleteItem({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation<R | null, PostgrestError, string, Partial<T['Row']>>(
    key,
    async (_, { arg }) => {
      const result = await buildDeleteFetcher<S, T, RelationName, Re, Q, R>(
        qb,
        primaryKeys,
        {
          query: query ?? undefined,
          queriesForTable,
          disabled: opts?.disableAutoQuery,
          ...opts,
        },
      )(arg);

      if (result) {
        deleteItem(result?.normalizedData as T['Row']);
      }

      return result?.userQueryData ?? null;
    },
    opts,
  );
}

export { useDeleteMutation };
