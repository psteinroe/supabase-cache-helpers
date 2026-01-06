import { useRevalidateForDelete } from '../cache';
import type { UseMutationOptions } from './types';
import { useRandomKey } from './use-random-key';
import {
  buildDeleteFetcher,
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
 * Hook for performing a DELETE mutation on multiple items in a PostgREST resource.
 *
 * @param opts - Options object containing query builder, primaryKeys, and other configuration.
 * @returns A SWRMutationResponse object containing the mutation response data, error, and mutation function.
 *
 * @example
 * ```tsx
 * const { trigger } = useDeleteManyMutation({
 *   query: client.from('contact'),
 *   primaryKeys: ['id'],
 *   returning: 'id,name',
 *   onSuccess: () => console.log('deleted')
 * });
 * ```
 */
function useDeleteManyMutation<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q, O>,
>(
  opts: UseMutationOptions<'DeleteMany', O, S, T, RelationName, Re, Q, R>,
): SWRMutationResponse<
  R[] | null,
  PostgrestError,
  string,
  Partial<T['Row']>[]
> {
  const { query: qb, primaryKeys, returning, ...rest } = opts;
  const key = useRandomKey();
  const revalidateForDelete = useRevalidateForDelete({
    ...rest,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation<R[] | null, PostgrestError, string, Partial<T['Row']>[]>(
    key,
    async (_, { arg }) => {
      const result = await buildDeleteFetcher<O, S, T, RelationName, Re, Q, R>(
        qb,
        primaryKeys,
        {
          query: returning ?? undefined,
          ...rest,
        },
      )(arg);

      if (result) {
        for (const r of result) {
          await revalidateForDelete(r.normalizedData as T['Row']);
        }
      }

      if (!result || result.every((r) => !r.userQueryData)) return null;

      return result.map((r) => r.userQueryData as R);
    },
    rest,
  );
}

export { useDeleteManyMutation };
