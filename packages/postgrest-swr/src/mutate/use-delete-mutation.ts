import {
  buildDeleteFetcher,
  MutationFetcherResponse,
} from '@supabase-cache-helpers/postgrest-fetcher';
import { getTable } from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestError, PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import useMutation, { SWRMutationResponse } from 'swr/mutation';

import { useDeleteItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { UsePostgrestSWRMutationOpts } from './types';
import { useRandomKey } from './use-random-key';

function useDeleteMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T['Row'])[],
  query?: (Q extends '*' ? "'*' is not allowed" : Q) | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, 'DeleteOne', Q, R>
): SWRMutationResponse<R | null, PostgrestError, Partial<T['Row']>> {
  const key = useRandomKey();
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const deleteItem = useDeleteItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  return useMutation<R | null, PostgrestError, string, Partial<T['Row']>>(
    key,
    async (_, { arg }) => {
      const result = await buildDeleteFetcher<S, T, Q, R>(qb, primaryKeys, {
        query: query ?? undefined,
        queriesForTable,
        disabled: opts?.disableAutoQuery,
      })(arg);

      if (result) {
        deleteItem(result?.normalizedData as T['Row']);
      }

      return result?.userQueryData ?? null;
    },
    opts
  );
}

export { useDeleteMutation };
