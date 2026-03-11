import { useRevalidateForUpsert } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import type { UseMutationOptions } from './types';
import {
  buildUpdateFetcher,
  getTable,
} from '@supabase-cache-helpers/postgrest-core';
import {
  GenericSchema,
  GenericTable,
} from '@supabase-cache-helpers/postgrest-core';
import { PostgrestClientOptions } from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook to execute an UPDATE mutation
 *
 * @param opts - Options object containing query builder, primaryKeys, and other configuration.
 *
 * @example
 * ```tsx
 * const { mutate } = useUpdateMutation({
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
  Relationships = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<
    S,
    T['Row'],
    RelationName,
    Relationships,
    Q extends '*' ? '*' : Q,
    O
  >,
>(
  opts: UseMutationOptions<
    'UpdateOne',
    O,
    S,
    T,
    RelationName,
    Relationships,
    Q,
    R
  >,
) {
  const { query: qb, primaryKeys, returning, ...rest } = opts;
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const revalidateForUpsert = useRevalidateForUpsert({
    ...rest,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input: T['Update']) => {
      const result = await buildUpdateFetcher<
        O,
        S,
        T,
        RelationName,
        Relationships,
        Q,
        R
      >(qb, primaryKeys, {
        query: returning ?? undefined,
        queriesForTable,
        ...rest,
      })(input);
      if (result) {
        await revalidateForUpsert(result.normalizedData as T['Row']);
      }
      return result?.userQueryData ?? null;
    },
    ...rest,
  });
}

export { useUpdateMutation };
