import { useRevalidateForUpsert } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import type { UseMutationOptions } from './types';
import { useRandomKey } from './use-random-key';
import {
  buildUpdateFetcher,
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
import useSWRMutation, { type SWRMutationResponse } from 'swr/mutation';

/**
 * Hook for performing an UPDATE mutation on a PostgREST resource.
 *
 * @param opts - Options object containing query builder, primaryKeys, and other configuration.
 * @returns A SWRMutationResponse object containing the mutation response data, error, and mutation function.
 *
 * @example
 * ```tsx
 * const { trigger } = useUpdateMutation({
 *   query: client.from('contact'),
 *   primaryKeys: ['id'],
 *   returning: 'id,name',
 *   onSuccess: () => console.log('updated')
 * });
 * ```
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
  opts: UseMutationOptions<'UpdateOne', O, S, T, RelationName, Re, Q, R>,
): SWRMutationResponse<R | null, PostgrestError, string, T['Update']> {
  const { query: qb, primaryKeys, returning, ...rest } = opts;
  const key = useRandomKey();
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const revalidateForUpsert = useRevalidateForUpsert({
    ...rest,
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
          query: returning ?? undefined,
          queriesForTable,
          ...rest,
        },
      )(arg);

      if (result?.normalizedData) {
        await revalidateForUpsert(result?.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    rest,
  );
}

export { useUpdateMutation };
