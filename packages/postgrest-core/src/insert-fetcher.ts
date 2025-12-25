import {
  type MutationFetcherResponse,
  buildMutationFetcherResponse,
} from './fetch/build-mutation-fetcher-response';
import {
  type BuildNormalizedQueryOps,
  buildNormalizedQuery,
} from './fetch/build-normalized-query';
import { GenericSchema, GenericTable } from './lib/postgrest-types';
import type {
  PostgrestClientOptions,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';

export type InsertFetcher<T extends GenericTable, R> = (
  input: T['Insert'][],
) => Promise<MutationFetcherResponse<R>[] | null>;

export type InsertFetcherOptions<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
> = Parameters<PostgrestQueryBuilder<O, S, T, Re>['insert']>[1];

function buildInsertFetcher<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q, O>,
>(
  qb: PostgrestQueryBuilder<O, S, T, Re>,
  opts: BuildNormalizedQueryOps<Q> & InsertFetcherOptions<O, S, T, Re>,
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
