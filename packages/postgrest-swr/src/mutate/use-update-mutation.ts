import { buildUpdateFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import {
  getTable,
  QueryWithoutWildcard,
} from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestError, PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';

import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { UsePostgrestSWRMutationOpts } from './types';
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
  S extends GenericSchema,
  T extends GenericTable,
  Relationships,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Relationships, Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T['Row'])[],
  query?: QueryWithoutWildcard<Q> | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, Relationships, 'UpdateOne', Q, R>
): SWRMutationResponse<R | null, PostgrestError, T['Update']> {
  const key = useRandomKey();
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  return useSWRMutation<R | null, PostgrestError, string, T['Update']>(
    key,
    async (_, { arg }) => {
      const result = await buildUpdateFetcher<S, T, Relationships, Q, R>(
        qb,
        primaryKeys,
        {
          query: query ?? undefined,
          queriesForTable,
          disabled: opts?.disableAutoQuery,
          ...opts,
        }
      )(arg);

      if (result?.normalizedData) {
        upsertItem(result?.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    opts
  );
}

export { useUpdateMutation };
