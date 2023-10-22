import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import { PostgrestError } from '@supabase/supabase-js';
import {
  InsertFetcherOptions,
  UpdateFetcherOptions,
  UpsertFetcherOptions,
  DeleteFetcherOptions,
  PostgrestMutatorOpts,
} from '@supabase-cache-helpers/postgrest-core';
import { MutatorOptions as SWRMutatorOptions } from 'swr';
import { SWRMutationConfiguration } from 'swr/mutation';

export type { SWRMutationConfiguration, PostgrestError };

export type Operation = 'Insert' | 'UpdateOne' | 'Upsert' | 'DeleteOne';

type GetFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable,
  O extends Operation,
> = O extends 'Insert'
  ? InsertFetcherOptions<S, T>
  : O extends 'UpdateOne'
  ? UpdateFetcherOptions<S, T>
  : O extends 'Upsert'
  ? UpsertFetcherOptions<S, T>
  : O extends 'DeleteOne'
  ? DeleteFetcherOptions<S, T>
  : never;

export type GetInputType<
  T extends GenericTable,
  O extends Operation,
> = O extends 'DeleteOne'
  ? Partial<T['Row']> // TODO: Can we pick the primary keys somehow?
  : O extends 'Insert' | 'Upsert'
  ? T['Insert'][]
  : O extends 'UpdateOne'
  ? T['Update']
  : never;

export type GetReturnType<
  S extends GenericSchema,
  T extends GenericTable,
  Relationships,
  O extends Operation,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Relationships, Q extends '*' ? '*' : Q>,
> = O extends 'UpdateOne'
  ? R | null
  : O extends 'DeleteOne'
  ? R | null
  : O extends 'Insert' | 'Upsert'
  ? R[] | null
  : never;

export type UsePostgrestSWRMutationOpts<
  S extends GenericSchema,
  T extends GenericTable,
  Relationships,
  O extends Operation,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Relationships, Q extends '*' ? '*' : Q>,
> = PostgrestMutatorOpts<T['Row']> &
  Pick<SWRMutatorOptions, 'throwOnError' | 'revalidate'> &
  SWRMutationConfiguration<
    GetReturnType<S, T, Relationships, O, Q, R>,
    PostgrestError,
    string,
    GetInputType<T, O>
  > & { disableAutoQuery?: boolean } & GetFetcherOptions<S, T, O>;
