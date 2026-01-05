import { useRevalidateForDelete } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import type { UseMutationOptions } from './types';
import {
  buildDeleteFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import {
  GenericSchema,
  GenericTable,
} from '@supabase-cache-helpers/postgrest-core';
import type { PostgrestClientOptions } from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook to execute a DELETE mutation on multiple items
 *
 * @param opts - Options object containing query builder, primaryKeys, and other configuration.
 *
 * @example
 * ```tsx
 * const { mutate } = useDeleteManyMutation({
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
>(opts: UseMutationOptions<'DeleteMany', O, S, T, RelationName, Re, Q, R>) {
  const { query: qb, primaryKeys, returning, ...rest } = opts;
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const revalidateForDelete = useRevalidateForDelete({
    ...rest,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input: Partial<T['Row']>[]) => {
      const result = await buildDeleteFetcher<O, S, T, RelationName, Re, Q, R>(
        qb,
        primaryKeys,
        {
          query: returning ?? undefined,
          queriesForTable,
          ...rest,
        },
      )(input);

      if (result) {
        for (const r of result) {
          await revalidateForDelete(r.normalizedData as T['Row']);
        }
      }

      if (!result || result.every((r) => !r.userQueryData)) return null;

      return result.map((r) => r.userQueryData as R);
    },
    ...rest,
  });
}

export { useDeleteManyMutation };
