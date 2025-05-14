import {
  buildInsertFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestError,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/cjs/types';
import useMutation, { type SWRMutationResponse } from 'swr/mutation';

import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { getUserResponse } from './get-user-response';
import type { UsePostgrestSWRMutationOpts } from './types';
import { useRandomKey } from './use-random-key';

/**
 * Hook for performing an INSERT mutation on a PostgREST resource.
 *
 * @param qb - The PostgrestQueryBuilder instance for the resource.
 * @param primaryKeys - An array of primary key column names for the table.
 * @param query - An optional query string.
 * @param opts - An optional object of options to configure the mutation.
 * @returns A SWRMutationResponse object containing the mutation response data, error, and mutation function.
 */
function useInsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q>,
>(
  qb: PostgrestQueryBuilder<S, T, RelationName, Re>,
  primaryKeys: (keyof T['Row'])[],
  query?: Q | null,
  opts?: UsePostgrestSWRMutationOpts<'Insert', S, T, RelationName, Re, Q, R>,
): SWRMutationResponse<R[] | null, PostgrestError, string, T['Insert'][]> {
  const key = useRandomKey();
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation<R[] | null, PostgrestError, string, T['Insert'][]>(
    key,
    async (_, { arg }) => {
      const result = await buildInsertFetcher<S, T, RelationName, Re, Q, R>(
        qb,
        {
          query: query ?? undefined,
          queriesForTable,
          disabled: opts?.disableAutoQuery,
          ...opts,
        },
      )(arg);

      if (result) {
        Promise.all(
          (result ?? []).map(
            async (d) => await upsertItem(d.normalizedData as T['Row']),
          ),
        );
      }

      return getUserResponse(result);
    },
    opts,
  );
}

export { useInsertMutation };
