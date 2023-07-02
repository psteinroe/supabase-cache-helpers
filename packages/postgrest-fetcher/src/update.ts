import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';

import { loadQuery, LoadQueryOps } from './lib/load-query';
import {
  buildMutationFetcherResponse,
  MutationFetcherResponse,
} from './lib/mutation-response';

export type UpdateFetcher<T extends GenericTable, R> = (
  input: Partial<T['Row']>
) => Promise<MutationFetcherResponse<R> | null>;

export type UpdateFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable
> = Parameters<PostgrestQueryBuilder<S, T>['update']>[1];

export const buildUpdateFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    Relationships,
    Q extends string = '*',
    R = GetResult<S, T['Row'], Relationships, Q extends '*' ? '*' : Q>
  >(
    qb: PostgrestQueryBuilder<S, T>,
    primaryKeys: (keyof T['Row'])[],
    opts: LoadQueryOps<Q> & UpdateFetcherOptions<S, T>
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
    const query = loadQuery<Q>(opts);
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
