import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';

import { LoadQueryOps } from './lib/load-query';
import { MutationFetcherResponse } from './lib/mutation-response';

export type DeleteFetcher<T extends GenericTable, R> = (
  input: Partial<T['Row']>
) => Promise<MutationFetcherResponse<R> | null>;

export const buildDeleteFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    Q extends string = '*',
    R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
  >(
    qb: PostgrestQueryBuilder<S, T>,
    primaryKeys: (keyof T['Row'])[],
    opts: LoadQueryOps<Q>
  ): DeleteFetcher<T, R> =>
  async (
    input: Partial<T['Row']>
  ): Promise<MutationFetcherResponse<R> | null> => {
    let filterBuilder = qb.delete();
    for (const key of primaryKeys) {
      const value = input[key];
      if (!value)
        throw new Error(`Missing value for primary key ${String(key)}`);
      filterBuilder = filterBuilder.eq(key as string, value);
    }
    const primaryKeysData = primaryKeys.reduce<R>((prev, key) => {
      return {
        ...prev,
        [key]: input[key],
      };
    }, {} as R);
    if (!opts.disabled && opts.query) {
      const { data } = await filterBuilder
        .select(opts.query)
        .throwOnError()
        .single();
      return {
        // since we are deleting, only the primary keys are required
        normalizedData: primaryKeysData,
        userQueryData: data as R,
      };
    }
    await filterBuilder.throwOnError().single();
    if (opts.queriesForTable().length > 0) {
      // if there is at least one query on the table we are deleting from, return primary keys
      return { normalizedData: primaryKeysData };
    }
    return null;
  };
