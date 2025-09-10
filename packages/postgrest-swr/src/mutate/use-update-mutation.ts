import {
  buildUpdateFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestError,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/cjs/types';
import useSWRMutation, { type SWRMutationResponse } from 'swr/mutation';

import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import type { UsePostgrestSWRMutationOpts } from './types';
import { useRandomKey } from './use-random-key';

/**
 * Hook for performing an UPDATE mutation on a PostgREST resource.
 *
 * @param qb - The PostgrestQueryBuilder instance for the resource.
 * @param primaryKeys - An array of primary key column names for the table.
 * @param query - An optional query string.
 * @param opts - An optional object of options to configure the mutation.
 * @returns A SWRMutationResponse object containing the mutation response data, error, and mutation function.
 */
function useUpdateMutation<
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
  opts?: UsePostgrestSWRMutationOpts<'UpdateOne', S, T, RelationName, Re, Q, R>,
): SWRMutationResponse<R | null, PostgrestError, string, T['Update']> {
  const key = useRandomKey();
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    ...opts,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useSWRMutation<R | null, PostgrestError, string, T['Update']>(
    key,
    async (_, { arg }) => {
      const result = await buildUpdateFetcher<O, S, T, RelationName, Re, Q, R>(
        qb,
        primaryKeys,
        {
          query: query ?? undefined,
          queriesForTable,
          disabled: opts?.disableAutoQuery,
          ...opts,
        },
      )(arg);

      if (result?.normalizedData) {
        upsertItem(result?.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    opts,
  );
}

export { useUpdateMutation };
