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
import type { PostgrestClientOptions } from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import useMutation from 'swr/mutation';

/**
 * Hook for performing a DELETE mutation.
 * Accepts either a single item or an array of items.
 *
 * @param opts - Options object containing query builder, primaryKeys, and other configuration.
 * @returns A SWRMutationResponse object containing the mutation response data, error, and trigger function.
 *
 * @example
 * ```tsx
 * const { trigger } = useDeleteMutation({
 *   query: client.from('contact'),
 *   primaryKeys: ['id'],
 *   returning: 'id,name',
 *   onSuccess: () => console.log('deleted')
 * });
 *
 * // Delete a single item
 * trigger({ id: 1 });
 *
 * // Delete multiple items
 * trigger([{ id: 1 }, { id: 2 }]);
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
>(opts: UseMutationOptions<'Delete', O, S, T, RelationName, Re, Q, R>) {
  const { query: qb, primaryKeys, returning, ...rest } = opts;
  const key = useRandomKey();
  const revalidateForDelete = useRevalidateForDelete({
    ...rest,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation(
    key,
    async (_, { arg }: { arg: Partial<T['Row']> | Partial<T['Row']>[] }) => {
      const isArray = Array.isArray(arg);
      const items = isArray ? arg : [arg];

      const result = await buildDeleteFetcher<O, S, T, RelationName, Re, Q, R>(
        qb,
        primaryKeys,
        {
          query: returning ?? undefined,
          ...rest,
        },
      )(items);

      if (result) {
        await Promise.all(
          result.map((r) => revalidateForDelete(r.normalizedData as T['Row'])),
        );
      }

      if (!result || result.every((r) => !r.userQueryData)) return null;

      if (isArray) {
        return result.map((r) => r.userQueryData as R);
      }
      return result[0]?.userQueryData as R;
    },
    rest,
  );
}

export { useDeleteMutation };
