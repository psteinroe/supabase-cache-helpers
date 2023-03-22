import { buildInsertFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import { getTable } from '@supabase-cache-helpers/postgrest-shared';
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

function useInsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T['Row'])[],
  query?: (Q extends '*' ? "'*' is not allowed" : Q) | null,
  opts?: Omit<UsePostgrestMutationOpts<S, T, 'Insert', Q, R>, 'mutationFn'>
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
      const result = await buildInsertFetcher<S, T, Q, R>(qb, {
        query: query ?? undefined,
        queriesForTable,
        disabled: opts?.disableAutoQuery,
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
