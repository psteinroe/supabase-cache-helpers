import { PostgrestMutatorOpts } from '@supabase-cache-helpers/postgrest-mutate';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import { PostgrestError } from '@supabase/supabase-js';
import { MutatorOptions as SWRMutatorOptions } from 'swr';
import { SWRMutationConfiguration } from 'swr/mutation';

export type { SWRMutationConfiguration, PostgrestError };

export type Operation = 'Insert' | 'UpdateOne' | 'Upsert' | 'DeleteOne';

export type GetInputType<
  T extends GenericTable,
  O extends Operation
> = O extends 'DeleteOne'
  ? Partial<T['Row']> // TODO: Can we pick the primary keys somehow?
  : O extends 'Insert' | 'Upsert'
  ? T['Insert'] | T['Insert'][]
  : O extends 'UpdateOne'
  ? T['Update']
  : never;

export type GetReturnType<
  S extends GenericSchema,
  T extends GenericTable,
  O extends Operation,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
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
  O extends Operation,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
> = PostgrestMutatorOpts<T['Row']> &
  Pick<SWRMutatorOptions, 'throwOnError' | 'revalidate'> &
  Pick<
    SWRMutationConfiguration<
      GetReturnType<S, T, O, Q, R>,
      PostgrestError,
      GetInputType<T, O>,
      string
    >,
    'onSuccess' | 'onError' | 'revalidate' | 'throwOnError'
  > & { disableAutoQuery?: boolean };
