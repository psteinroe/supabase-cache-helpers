import { useRevalidateForUpsert } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { getUserResponse } from './get-user-response';
import type { UseMutationOptions } from './types';
import { useRandomKey } from './use-random-key';
import {
  buildInsertFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import {
  GenericSchema,
  GenericTable,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestClientOptions,
  PostgrestError,
} from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import useMutation, { type SWRMutationResponse } from 'swr/mutation';

/**
 * Hook for performing an INSERT mutation on a PostgREST resource.
 *
 * @param opts - Options object containing query builder, primaryKeys, and other configuration.
 * @returns A SWRMutationResponse object containing the mutation response data, error, and mutation function.
 *
 * @example
 * ```tsx
 * const { trigger } = useInsertMutation({
 *   query: client.from('contact'),
 *   primaryKeys: ['id'],
 *   returning: 'id,name',
 *   onSuccess: () => console.log('inserted')
 * });
 * ```
 */
function useInsertMutation<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q, O>,
>(
  opts: UseMutationOptions<'Insert', O, S, T, RelationName, Re, Q, R>,
): SWRMutationResponse<R[] | null, PostgrestError, string, T['Insert'][]> {
  const { query: qb, primaryKeys, returning, ...rest } = opts;
  const key = useRandomKey();
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const revalidateForUpsert = useRevalidateForUpsert({
    ...rest,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation<R[] | null, PostgrestError, string, T['Insert'][]>(
    key,
    async (_, { arg }) => {
      const result = await buildInsertFetcher<O, S, T, RelationName, Re, Q, R>(
        qb,
        {
          query: returning ?? undefined,
          queriesForTable,
          ...rest,
        },
      )(arg);

      if (result) {
        await Promise.all(
          (result ?? []).map(
            async (d) =>
              await revalidateForUpsert(d.normalizedData as T['Row']),
          ),
        );
      }

      return getUserResponse(result);
    },
    rest,
  );
}

export { useInsertMutation };
