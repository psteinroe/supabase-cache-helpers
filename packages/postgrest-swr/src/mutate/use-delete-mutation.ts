import { buildDeleteFetcher } from '@supabase-cache-helpers/postgrest-fetcher';
import { getTable } from '@supabase-cache-helpers/postgrest-shared';
import { PostgrestError, PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import useMutation, { MutationResult } from 'use-mutation';

import { useDeleteItem } from '../cache';
import { UsePostgrestSWRMutationOpts } from './types';

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
): MutationResult<Partial<T['Row']>, R | null, PostgrestError> {
  const deleteItem = useDeleteItem({
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
    opts,
  });

  return useMutation<Partial<T['Row']>, R | null, PostgrestError>(
    buildDeleteFetcher<S, T, Q, R>(qb, primaryKeys, query),
    {
      ...opts,
      async onSuccess(params): Promise<void> {
        await deleteItem(params.input);
        if (opts?.onSuccess)
          await opts.onSuccess({
            input: params.input,
            data: params.data ?? null,
          });
      },
    }
  );
}

export { useDeleteMutation };
