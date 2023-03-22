import { buildUpdateFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import { getTable } from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import { UseMutateAsyncFunction, useMutation } from '@tanstack/react-query';

import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { UsePostgrestMutationOpts } from './types';

function useUpdateMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T['Row'])[],
  query?: (Q extends '*' ? "'*' is not allowed" : Q) | null,
  opts?: Omit<UsePostgrestMutationOpts<S, T, 'UpdateOne', Q, R>, 'mutationFn'>
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
      const result = await buildUpdateFetcher<S, T, Q, R>(qb, primaryKeys, {
        query: query ?? undefined,
        queriesForTable,
        disabled: opts?.disableAutoQuery,
      })(input);
      if (result) {
        await upsertItem(result.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    ...opts,
  });
}

export { useUpdateMutation };
