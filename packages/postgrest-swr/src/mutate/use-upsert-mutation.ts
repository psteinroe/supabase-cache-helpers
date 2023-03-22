import {
  buildUpsertFetcher,
  MutationFetcherResponse,
} from '@supabase-cache-helpers/postgrest-fetcher';
import { getTable } from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestError, PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import { useMemo } from 'react';
import useMutation, { SWRMutationResponse } from 'swr/mutation';

import { useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { getUserResponse } from './get-user-response';
import { UsePostgrestSWRMutationOpts } from './types';
import { useRandomKey } from './use-random-key';

function useUpsertMutation<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  primaryKeys: (keyof T['Row'])[],
  query?: (Q extends '*' ? "'*' is not allowed" : Q) | null,
  opts?: UsePostgrestSWRMutationOpts<S, T, 'Upsert', Q, R>
): SWRMutationResponse<R[] | null, PostgrestError, T['Insert'][], string> {
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
    async (_, { arg }) => {
      const result = await buildUpsertFetcher<S, T, Q, R>(qb, {
        query: query ?? undefined,
        queriesForTable,
        disabled: opts?.disableAutoQuery,
      })(arg);
      if (result) {
        Promise.all(
          result.map(
            async (d) => await upsertItem(d.normalizedData as T['Row'])
          )
        );
      }
      return getUserResponse(result);
    },
    opts
  );
}

export { useUpsertMutation };
