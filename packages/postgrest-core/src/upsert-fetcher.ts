import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import { GenericTable } from '@supabase/postgrest-js/dist/module/types';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';

import {
  buildMutationFetcherResponse,
  MutationFetcherResponse,
} from './fetch/build-mutation-fetcher-response';
import {
  buildNormalizedQuery,
  BuildNormalizedQueryOps,
} from './fetch/build-normalized-query';

export type UpsertFetcher<T extends GenericTable, R> = (
  input: T['Insert'][],
) => Promise<MutationFetcherResponse<R>[] | null>;

export type UpsertFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
> = Parameters<PostgrestQueryBuilder<S, T, Re>['upsert']>[1];

export const buildUpsertFetcher =
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
    opts: BuildNormalizedQueryOps<Q> & UpsertFetcherOptions<S, T>,
  ): UpsertFetcher<T, R> =>
  async (
    input: T['Insert'][],
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    const upsertOptsWithDefaults: UpsertFetcherOptions<S, T> = {
      onConflict: primaryKeys.join(','),
      ...opts,
    };
    const query = buildNormalizedQuery<Q>(opts);
    if (query) {
      const { selectQuery, userQueryPaths, paths } = query;
      const { data } = await qb
        .upsert(input as any, upsertOptsWithDefaults) // todo fix type
        .throwOnError()
        .select(selectQuery);
      return (data as R[]).map((d) =>
        buildMutationFetcherResponse(d, { paths, userQueryPaths }),
      );
    }
    await qb
      .upsert(input as any, upsertOptsWithDefaults) // todo fix type
      .throwOnError();
    return null;
  };
