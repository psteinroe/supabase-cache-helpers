import type { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/cjs/types';

import {
  type MutationFetcherResponse,
  buildMutationFetcherResponse,
} from './fetch/build-mutation-fetcher-response';
import {
  type BuildNormalizedQueryOps,
  buildNormalizedQuery,
} from './fetch/build-normalized-query';

export type UpdateFetcher<T extends GenericTable, R> = (
  input: Partial<T['Row']>,
) => Promise<MutationFetcherResponse<R> | null>;

export type UpdateFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
> = Parameters<PostgrestQueryBuilder<S, T, Re>['update']>[1] & {
  stripPrimaryKeys?: boolean;
};

export const buildUpdateFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    RelationName,
    Re = T extends { Relationships: infer R } ? R : unknown,
    Q extends string = '*',
    R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q>,
  >(
    qb: PostgrestQueryBuilder<S, T, Re>,
    primaryKeys: (keyof T['Row'])[],
    {
      stripPrimaryKeys = true,
      ...opts
    }: BuildNormalizedQueryOps<Q> & UpdateFetcherOptions<S, T>,
  ): UpdateFetcher<T, R> =>
  async (
    input: Partial<T['Row']>,
  ): Promise<MutationFetcherResponse<R> | null> => {
    const payload = stripPrimaryKeys
      ? primaryKeys.reduce<typeof input>(
          (acc, key) => {
            delete acc[key];
            return acc;
          },
          { ...input },
        )
      : input;
    let filterBuilder = qb.update(payload as any, opts); // todo fix type;
    for (const key of primaryKeys) {
      const value = input[key];
      // The value can be 0 or false, so we need to check if it's null or undefined instead of falsy
      if (value === null || value === undefined)
        throw new Error(`Missing value for primary key ${String(key)}`);
      // todo fix type
      filterBuilder = filterBuilder.eq(key as string, value as any);
    }

    const query = buildNormalizedQuery<Q>(opts);
    if (query) {
      const { selectQuery, groupedUserQueryPaths, groupedPaths } = query;
      const { data } = await filterBuilder
        .select(selectQuery)
        .throwOnError()
        .single();
      return buildMutationFetcherResponse(data as R, {
        groupedPaths,
        groupedUserQueryPaths,
      });
    }
    await filterBuilder.throwOnError().single();
    return { normalizedData: input as R };
  };
