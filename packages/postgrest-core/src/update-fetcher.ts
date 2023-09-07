import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';

import {
  buildMutationFetcherResponse,
  MutationFetcherResponse,
} from './lib/build-mutation-fetcher-response';
import { buildQuery, BuildQueryOps } from './lib/build-query';

export type UpdateFetcher<T extends GenericTable, R> = (
  input: Partial<T['Row']>
) => Promise<MutationFetcherResponse<R> | null>;

export type UpdateFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown
> = Parameters<PostgrestQueryBuilder<S, T, Re>['update']>[1];

export const buildUpdateFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    Re = T extends { Relationships: infer R } ? R : unknown,
    Q extends string = '*',
    R = GetResult<S, T['Row'], Re, Q extends '*' ? '*' : Q>
  >(
    qb: PostgrestQueryBuilder<S, T, Re>,
    primaryKeys: (keyof T['Row'])[],
    opts: BuildQueryOps<Q> & UpdateFetcherOptions<S, T>
  ): UpdateFetcher<T, R> =>
  async (
    input: Partial<T['Row']>
  ): Promise<MutationFetcherResponse<R> | null> => {
    let filterBuilder = qb.update(input as any, opts); // todo fix type;
    for (const key of primaryKeys) {
      const value = input[key];
      if (!value)
        throw new Error(`Missing value for primary key ${String(key)}`);
      filterBuilder = filterBuilder.eq(key as string, value);
    }
    const query = buildQuery<Q>(opts);
    if (query) {
      const { selectQuery, userQueryPaths, paths } = query;
      const { data } = await filterBuilder
        .select(selectQuery)
        .throwOnError()
        .single();
      return buildMutationFetcherResponse(data as R, { userQueryPaths, paths });
    }
    await filterBuilder.throwOnError().single();
    return null;
  };
