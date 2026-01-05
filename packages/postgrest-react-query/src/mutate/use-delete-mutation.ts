import { useRevalidateForDelete } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import type { UsePostgrestMutationOpts } from './types';
import {
  buildDeleteFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import {
  GenericSchema,
  GenericTable,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook to execute a DELETE mutation
 *
 * @param {PostgrestQueryBuilder<S, T>} qb PostgrestQueryBuilder instance for the table
 * @param {Array<keyof T['Row']>} primaryKeys Array of primary keys of the table
 * @param {string | null} query Optional PostgREST query string for the DELETE mutation
 * @param {Omit<UsePostgrestMutationOpts<S, T, 'DeleteOne', Q, R>, 'mutationFn'>} [opts] Options to configure the hook
 */
function useDeleteMutation<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q, O>,
>(
  qb: PostgrestQueryBuilder<O, S, T, RelationName, Re>,
  primaryKeys: (keyof T['Row'])[],
  query?: Q | null,
  opts?: Omit<
    UsePostgrestMutationOpts<'DeleteOne', S, T, RelationName, Re, Q, R>,
    'mutationFn'
  >,
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const revalidateForDelete = useRevalidateForDelete({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input) => {
      const r = await buildDeleteFetcher<O, S, T, RelationName, Re, Q, R>(
        qb,
        primaryKeys,
        {
          query: query ?? undefined,
          queriesForTable,
          ...opts,
        },
      )([input]);

      if (!r) return null;

      const result = r[0];

      if (result) {
        await revalidateForDelete(result.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    ...opts,
  });
}

export { useDeleteMutation };
