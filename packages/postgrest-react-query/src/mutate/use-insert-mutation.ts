import { buildInsertFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import {
  getTable,
  QueryWithoutWildcard,
} from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import { useMutation } from '@tanstack/react-query';

import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { getUserResponse } from './get-user-response';
import { UsePostgrestMutationOpts } from './types';

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
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Re, Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T, Re>,
  primaryKeys: (keyof T['Row'])[],
  query?: QueryWithoutWildcard<Q> | null,
  opts?: Omit<UsePostgrestMutationOpts<S, T, Re, 'Insert', Q, R>, 'mutationFn'>
) {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  return useMutation({
    mutationFn: async (input) => {
      const result = await buildInsertFetcher<S, T, Re, Q, R>(qb, {
        query: query ?? undefined,
        queriesForTable,
        disabled: opts?.disableAutoQuery,
        ...opts,
      })(input);

      if (result) {
        await Promise.all(
          result.map(
            async (d) => await upsertItem(d.normalizedData as T['Row'])
          )
        );
      }
      return getUserResponse(result) ?? null;
    },
    ...opts,
  });
}

export { useInsertMutation };
