import { buildInsertFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
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
import useMutation, { SWRMutationResponse } from 'swr/mutation';

import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { getUserResponse } from './get-user-response';
import { UsePostgrestSWRMutationOpts } from './types';
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
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T['Row'])[],
  query?: QueryWithoutWildcard<Q> | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, 'Insert', Q, R>
): SWRMutationResponse<R[] | null, PostgrestError, T['Insert'][]> {
  const key = useRandomKey();
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  return useMutation<R[] | null, PostgrestError, string, T['Insert'][]>(
    key,
    async (key, { arg }) => {
      const result = await buildInsertFetcher<S, T, Q, R>(qb, {
        query: query ?? undefined,
        queriesForTable,
        disabled: opts?.disableAutoQuery,
        ...opts,
      })(arg);

      if (result) {
        Promise.all(
          (result ?? []).map(
            async (d) => await upsertItem(d.normalizedData as T['Row'])
          )
        );
      }

      return getUserResponse(result);
    },
    opts
  );
}

export { useInsertMutation };
