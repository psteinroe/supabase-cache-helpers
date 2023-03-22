import { buildUpdateFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import { getTable } from '@supabase-cache-helpers/postgrest-shared';
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

function useUpdateMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T['Row'])[],
  query?: (Q extends '*' ? "'*' is not allowed" : Q) | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, 'UpdateOne', Q, R>
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
      const result = await buildUpdateFetcher<S, T, Q, R>(qb, primaryKeys, {
        query: query ?? undefined,
        queriesForTable,
        disabled: opts?.disableAutoQuery,
      })(arg);

      if (result?.normalizedData) {
        upsertItem(result?.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    opts
  );
}

export { useUpdateMutation };
