import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import { GenericTable } from '@supabase/postgrest-js/dist/module/types';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';

import {
  buildMutationFetcherResponse,
  MutationFetcherResponse,
} from './fetch/build-mutation-fetcher-response';
import {
  BuildNormalizedQueryOps,
  buildNormalizedQuery,
} from './fetch/build-normalized-query';

export type InsertFetcher<T extends GenericTable, R> = (
  input: T['Insert'][]
) => Promise<MutationFetcherResponse<R>[] | null>;

export type InsertFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown
> = Parameters<PostgrestQueryBuilder<S, T, Re>['insert']>[1];

function buildInsertFetcher<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Re, Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T, Re>,
  opts: BuildNormalizedQueryOps<Q> & InsertFetcherOptions<S, T, Re>
): InsertFetcher<T, R> {
  return async (
    input: T['Insert'][]
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    const query = buildNormalizedQuery<Q>(opts);
    if (query) {
      const { selectQuery, userQueryPaths, paths } = query;
      const { data } = await qb
        .insert(input as any, opts)
        .select(selectQuery)
        .throwOnError();
      // data cannot be null because of throwOnError()
      return (data as R[]).map((d) =>
        buildMutationFetcherResponse(d, { paths, userQueryPaths })
      );
    }
    await qb.insert(input as any).throwOnError();
    return null;
  };
}

export { buildInsertFetcher };
