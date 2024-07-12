import type { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/cjs/select-query-parser';
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

export type InsertFetcher<T extends GenericTable, R> = (
  input: T['Insert'][],
) => Promise<MutationFetcherResponse<R>[] | null>;

export type InsertFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
> = Parameters<PostgrestQueryBuilder<S, T, Re>['insert']>[1];

function buildInsertFetcher<
  S extends GenericSchema,
  T extends GenericTable,
  RelationName,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q>,
>(
  qb: PostgrestQueryBuilder<S, T, Re>,
  opts: BuildNormalizedQueryOps<Q> & InsertFetcherOptions<S, T, Re>,
): InsertFetcher<T, R> {
  return async (
    input: T['Insert'][],
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    const query = buildNormalizedQuery<Q>(opts);
    if (query) {
      const { selectQuery, groupedUserQueryPaths, groupedPaths } = query;
      const { data } = await qb
        .insert(input as any, opts)
        .select(selectQuery)
        .throwOnError();
      // data cannot be null because of throwOnError()
      return (data as R[]).map((d) =>
        buildMutationFetcherResponse(d, {
          groupedUserQueryPaths,
          groupedPaths,
        }),
      );
    }
    await qb.insert(input as any).throwOnError();
    return input.map((d) => ({ normalizedData: d as R }));
  };
}

export { buildInsertFetcher };
