import { useRevalidateForUpsert } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import type { UsePostgrestMutationOpts } from './types';
import {
  buildUpdateFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import {
  GenericSchema,
  GenericTable,
} from '@supabase-cache-helpers/postgrest-core';
import {
  PostgrestClientOptions,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook to execute a UPDATE mutation
 *
 * @param {PostgrestQueryBuilder<S, T>} qb PostgrestQueryBuilder instance for the table
 * @param {Array<keyof T['Row']>} primaryKeys Array of primary keys of the table
 * @param {string | null} query Optional PostgREST query string for the UPDATE mutation
 * @param {Omit<UsePostgrestMutationOpts<S, T, 'UpdateOne', Q, R>, 'mutationFn'>} [opts] Options to configure the hook
 */
function useUpdateMutation<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Relationships = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<
    S,
    T['Row'],
    RelationName,
    Relationships,
    Q extends '*' ? '*' : Q,
    O
  >,
>(
  qb: PostgrestQueryBuilder<O, S, T, RelationName, Relationships>,
  primaryKeys: (keyof T['Row'])[],
  query?: Q | null,
  opts?: Omit<
    UsePostgrestMutationOpts<
      'UpdateOne',
      S,
      T,
      RelationName,
      Relationships,
      Q,
      R
    >,
    'mutationFn'
  >,
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const revalidateForUpsert = useRevalidateForUpsert({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input) => {
      const result = await buildUpdateFetcher<
        O,
        S,
        T,
        RelationName,
        Relationships,
        Q,
        R
      >(qb, primaryKeys, {
        query: query ?? undefined,
        queriesForTable,
        ...opts,
      })(input);
      if (result) {
        await revalidateForUpsert(result.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    ...opts,
  });
}

export { useUpdateMutation };
