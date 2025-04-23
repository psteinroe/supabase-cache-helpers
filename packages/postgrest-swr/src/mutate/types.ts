import type {
  DeleteFetcherOptions,
  InsertFetcherOptions,
  RevalidateOpts,
  UpdateFetcherOptions,
  UpsertFetcherOptions,
} from '@supabase-cache-helpers/postgrest-core';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/cjs/types';
import type { PostgrestError } from '@supabase/supabase-js';
import type { MutatorOptions as SWRMutatorOptions } from 'swr';
import type { SWRMutationConfiguration } from 'swr/mutation';

export type { SWRMutationConfiguration, PostgrestError };

export type Operation =
  | 'Insert'
  | 'UpdateOne'
  | 'Upsert'
  | 'DeleteOne'
  | 'DeleteMany';

export type GetFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable,
  O extends Operation,
> = O extends 'Insert'
  ? InsertFetcherOptions<S, T>
  : O extends 'UpdateOne'
    ? UpdateFetcherOptions<S, T>
    : O extends 'Upsert'
      ? UpsertFetcherOptions<S, T>
      : O extends 'DeleteOne' | 'DeleteMany'
        ? DeleteFetcherOptions<S, T>
        : never;

export type GetInputType<
  T extends GenericTable,
  O extends Operation,
> = O extends 'DeleteOne'
  ? Partial<T['Row']> // TODO: Can we pick the primary keys somehow?
  : O extends 'DeleteMany'
    ? Partial<T['Row']>[]
    : O extends 'Insert' | 'Upsert'
      ? T['Insert'][]
      : O extends 'UpdateOne'
        ? T['Update']
        : never;

export type GetReturnType<
  O extends Operation,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName,
  Relationships = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<
    S,
    T['Row'],
    RelationName,
    Relationships,
    Q extends '*' ? '*' : Q
  >,
> = O extends 'UpdateOne'
  ? R | null
  : O extends 'DeleteOne'
    ? R | null
    : O extends 'Insert' | 'Upsert' | 'DeleteMany'
      ? R[] | null
      : never;

export type UsePostgrestSWRMutationOpts<
  O extends Operation,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName,
  Relationships = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<
    S,
    T['Row'],
    RelationName,
    Relationships,
    Q extends '*' ? '*' : Q
  >,
> = RevalidateOpts<T['Row']> &
  Pick<SWRMutatorOptions, 'throwOnError' | 'revalidate'> &
  SWRMutationConfiguration<
    GetReturnType<O, S, T, RelationName, Relationships, Q, R>,
    PostgrestError,
    string,
    GetInputType<T, O>
  > & { disableAutoQuery?: boolean } & GetFetcherOptions<S, T, O>;
