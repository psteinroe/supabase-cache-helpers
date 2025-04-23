import {
  buildInsertFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import type { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/cjs/types';
import { useMutation } from '@tanstack/react-query';

import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { getUserResponse } from './get-user-response';
import type { UsePostgrestMutationOpts } from './types';

/**
 * Hook to execute a INSERT mutation
 *
 * @param {PostgrestQueryBuilder<S, T>} qb PostgrestQueryBuilder instance for the table
 * @param {Array<keyof T['Row']>} primaryKeys Array of primary keys of the table
 * @param {string | null} query Optional PostgREST query string for the INSERT mutation
 * @param {Omit<UsePostgrestMutationOpts<S, T, 'Insert', Q, R>, 'mutationFn'>} [opts] Options to configure the hook
 */
function useInsertMutation<
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
    UsePostgrestMutationOpts<'Insert', S, T, RelationName, Re, Q, R>,
    'mutationFn'
  >,
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input) => {
      const result = await buildInsertFetcher<S, T, RelationName, Re, Q, R>(
        qb,
        {
          query: query ?? undefined,
          queriesForTable,
          disabled: opts?.disableAutoQuery,
          ...opts,
        },
      )(input);

      if (result) {
        await Promise.all(
          result.map(
            async (d) => await upsertItem(d.normalizedData as T['Row']),
          ),
        );
      }
      return getUserResponse(result) ?? null;
    },
    ...opts,
  });
}

export { useInsertMutation };
