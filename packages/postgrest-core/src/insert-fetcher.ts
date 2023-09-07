import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import { GenericTable } from '@supabase/postgrest-js/dist/module/types';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';

import {
  buildMutationFetcherResponse,
  MutationFetcherResponse,
} from './lib/build-mutation-fetcher-response';
import { BuildQueryOps, buildQuery } from './lib/build-query';

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
  opts: BuildQueryOps<Q> & InsertFetcherOptions<S, T, Re>
): InsertFetcher<T, R> {
  return async (
    input: T['Insert'][]
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    const query = buildQuery<Q>(opts);
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
