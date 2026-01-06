import { useRevalidateForDelete } from '../cache';
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
 * Hook to execute a DELETE mutation
 *
 * @param opts - Options object containing query builder, primaryKeys, and other configuration.
 *
 * @example
 * ```tsx
 * const { mutate } = useDeleteMutation({
 *   query: client.from('contact'),
 *   primaryKeys: ['id'],
 *   returning: 'id,name',
 *   onSuccess: () => console.log('deleted')
 * });
 * ```
 */
function useDeleteMutation<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q, O>,
>(opts: UseMutationOptions<'DeleteOne', O, S, T, RelationName, Re, Q, R>) {
  const { query: qb, primaryKeys, returning, ...rest } = opts;
  const revalidateForDelete = useRevalidateForDelete({
    ...rest,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input: Partial<T['Row']>) => {
      const r = await buildDeleteFetcher<O, S, T, RelationName, Re, Q, R>(
        qb,
        primaryKeys,
        {
          query: returning ?? undefined,
          ...rest,
        },
      )([input]);

      if (!r) return null;

      const result = r[0];

      if (result) {
        await revalidateForDelete(result.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    ...rest,
  });
}

export { useDeleteMutation };
