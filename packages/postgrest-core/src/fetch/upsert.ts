import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import { GenericTable } from '@supabase/postgrest-js/dist/module/types';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';

import { loadQuery, LoadQueryOps } from './lib/load-query';
import {
  buildMutationFetcherResponse,
  MutationFetcherResponse,
} from './lib/mutation-response';

export type UpsertFetcher<T extends GenericTable, R> = (
  input: T['Insert'][]
) => Promise<MutationFetcherResponse<R>[] | null>;

export type UpsertFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown
> = Parameters<PostgrestQueryBuilder<S, T, Re>['upsert']>[1];

export const buildUpsertFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    Re = T extends { Relationships: infer R } ? R : unknown,
    Q extends string = '*',
    R = GetResult<S, T['Row'], Re, Q extends '*' ? '*' : Q>
  >(
    qb: PostgrestQueryBuilder<S, T, Re>,
    opts: LoadQueryOps<Q> & UpsertFetcherOptions<S, T>
  ): UpsertFetcher<T, R> =>
  async (
    input: T['Insert'][]
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    const query = loadQuery<Q>(opts);
    if (query) {
      const { selectQuery, userQueryPaths, paths } = query;
      const { data } = await qb
        .upsert(input as any, opts) // todo fix type
        .throwOnError()
        .select(selectQuery);
      return (data as R[]).map((d) =>
        buildMutationFetcherResponse(d, { paths, userQueryPaths })
      );
    }
    await qb
      .upsert(input as any) // todo fix type
      .throwOnError();
    return null;
  };
