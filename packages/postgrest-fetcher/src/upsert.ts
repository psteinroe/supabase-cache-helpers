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

export const buildUpsertFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    Q extends string = '*',
    R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
  >(
    qb: PostgrestQueryBuilder<S, T>,
    opts: LoadQueryOps<Q>
  ): UpsertFetcher<T, R> =>
  async (
    input: T['Insert'][]
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    const query = loadQuery<Q>(opts);
    if (query) {
      const { selectQuery, userQueryPaths, paths } = query;
      const { data } = await qb
        .upsert(input as any) // todo fix type
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
