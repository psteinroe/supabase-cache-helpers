import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import {
  buildUpsertFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import { useMutation } from '@tanstack/vue-query';

import { getUserResponse } from './get-user-response';
import { UsePostgrestMutationOpts } from './types';
import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';

/**
 * Hook to execute a UPSERT mutation
 *
 * @param {PostgrestQueryBuilder<S, T>} qb PostgrestQueryBuilder instance for the table
 * @param {Array<keyof T['Row']>} primaryKeys Array of primary keys of the table
 * @param {string | null} query Optional PostgREST query string for the UPSERT mutation
 * @param {UsePostgrestMutationOpts<S, T, 'Upsert', Q, R>} [opts] Options to configure the hook
 */
function useUpsertMutation<
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
  opts?: UsePostgrestMutationOpts<S, T, RelationName, Re, 'Upsert', Q, R>,
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input: T['Insert'][]) => {
      const data = await buildUpsertFetcher<S, T, RelationName, Re, Q, R>(qb, {
        query: query ?? undefined,
        queriesForTable,
        disabled: opts?.disableAutoQuery,
        ...opts,
      })(input);
      if (data) {
        await Promise.all(
          data.map(async (d) => await upsertItem(d.normalizedData as T['Row'])),
        );
      }
      return getUserResponse(data) ?? null;
    },
    ...opts,
  });
}

export { useUpsertMutation };
