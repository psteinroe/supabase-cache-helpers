import {
  buildInsertFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/cjs/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/cjs/types';
import { type UseMutationResult, useMutation } from '@tanstack/react-query';

import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { getUserResponse } from './get-user-response';
import type { UsePostgrestMutationOpts } from './types';

/**
 * Hook to execute an INSERT mutation
 *
 * @param qb - PostgrestQueryBuilder instance for the table
 * @param primaryKeys - Array of primary keys of the table
 * @param query - Optional PostgREST query string for the INSERT mutation
 * @param opts - Options to configure the hook
 * @returns A mutation object with methods and state for the mutation
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
    UsePostgrestMutationOpts<S, T, RelationName, Re, 'Insert', Q, R>,
    'mutationFn'
  >,
): UseMutationResult<R[] | null, PostgrestError, T['Insert'][]> {
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation<R[] | null, PostgrestError, T['Insert'][]>({
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
