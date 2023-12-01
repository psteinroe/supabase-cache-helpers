import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import {
  buildDeleteFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import { useMutation } from '@tanstack/react-query';

import { UsePostgrestMutationOpts } from './types';
import { useDeleteItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';

/**
 * Hook to execute a DELETE mutation
 *
 * @param {PostgrestQueryBuilder<S, T>} qb PostgrestQueryBuilder instance for the table
 * @param {Array<keyof T['Row']>} primaryKeys Array of primary keys of the table
 * @param {string | null} query Optional PostgREST query string for the DELETE mutation
 * @param {Omit<UsePostgrestMutationOpts<S, T, 'DeleteOne', Q, R>, 'mutationFn'>} [opts] Options to configure the hook
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
  opts?: Omit<
    UsePostgrestMutationOpts<S, T, RelationName, Re, 'DeleteOne', Q, R>,
    'mutationFn'
  >,
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const deleteItem = useDeleteItem({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input) => {
      const result = await buildDeleteFetcher<S, T, RelationName, Re, Q, R>(
        qb,
        primaryKeys,
        {
          query: query ?? undefined,
          queriesForTable,
          disabled: opts?.disableAutoQuery,
          ...opts,
        },
      )(input);

      if (result) {
        await deleteItem(result.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    ...opts,
  });
}

export { useDeleteMutation };
