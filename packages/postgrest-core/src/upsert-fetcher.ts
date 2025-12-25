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

export type UpsertFetcher<T extends GenericTable, R> = (
  input: T['Insert'][],
) => Promise<MutationFetcherResponse<R>[] | null>;

export type UpsertFetcherOptions<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
> = Parameters<PostgrestQueryBuilder<O, S, T, Re>['upsert']>[1];

export const buildUpsertFetcher =
  <
    O extends PostgrestClientOptions,
    S extends GenericSchema,
    T extends GenericTable,
    RelationName,
    Re = T extends { Relationships: infer R } ? R : unknown,
    Q extends string = '*',
    R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q, O>,
  >(
    qb: PostgrestQueryBuilder<O, S, T, Re>,
    opts: BuildNormalizedQueryOps<Q> & UpsertFetcherOptions<O, S, T>,
  ): UpsertFetcher<T, R> =>
  async (
    input: T['Insert'][],
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    const query = buildNormalizedQuery<Q>(opts);
    if (query) {
      const { selectQuery, groupedUserQueryPaths, groupedPaths } = query;
      const { data } = await qb
        .upsert(input as any, opts) // todo fix type
        .throwOnError()
        .select(selectQuery);
      return (data as R[]).map((d) =>
        buildMutationFetcherResponse(d, {
          groupedPaths,
          groupedUserQueryPaths,
        }),
      );
    }
    await qb
      .upsert(input as any) // todo fix type
      .throwOnError();
    return input.map((d) => ({
      normalizedData: d as R,
    }));
  };
