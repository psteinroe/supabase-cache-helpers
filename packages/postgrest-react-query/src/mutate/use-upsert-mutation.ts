import { useRevalidateForUpsert } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { getUserResponse } from './get-user-response';
import type { UseMutationOptions } from './types';
import {
  buildUpsertFetcher,
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
 * Hook to execute an UPSERT mutation
 *
 * @param opts - Options object containing query builder, primaryKeys, and other configuration.
 *
 * @example
 * ```tsx
 * const { mutate } = useUpsertMutation({
 *   query: client.from('contact'),
 *   primaryKeys: ['id'],
 *   returning: 'id,name',
 *   onSuccess: () => console.log('upserted')
 * });
 * ```
 */
function useUpsertMutation<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q, O>,
>(opts: UseMutationOptions<'Upsert', O, S, T, RelationName, Re, Q, R>) {
  const { query: qb, primaryKeys, returning, ...rest } = opts;
  const queriesForTable = useQueriesForTableLoader(getTable(qb));
  const revalidateForUpsert = useRevalidateForUpsert({
    ...rest,
    primaryKeys,
    table: getTable(qb),
    schema: qb.schema as string,
  });

  return useMutation({
    mutationFn: async (input: T['Insert'][]) => {
      const data = await buildUpsertFetcher<O, S, T, RelationName, Re, Q, R>(
        qb,
        {
          query: returning ?? undefined,
          queriesForTable,
          ...rest,
        },
      )(input);
      if (data) {
        await Promise.all(
          data.map(
            async (d) =>
              await revalidateForUpsert(d.normalizedData as T['Row']),
          ),
        );
      }
      return getUserResponse(data) ?? null;
    },
    ...rest,
  });
}

export { useUpsertMutation };
