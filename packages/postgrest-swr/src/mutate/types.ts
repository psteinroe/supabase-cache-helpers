import type {
  DeleteFetcherOptions,
  InsertFetcherOptions,
  RevalidateOpts,
  UpdateFetcherOptions,
  UpsertFetcherOptions,
} from '@supabase-cache-helpers/postgrest-core';
import {
  GenericSchema,
  GenericTable,
} from '@supabase-cache-helpers/postgrest-core';
import {
  UnstableGetResult as GetResult,
  PostgrestClientOptions,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import type { PostgrestError } from '@supabase/supabase-js';
import type { MutatorOptions as SWRMutatorOptions } from 'swr';
import type { SWRMutationConfiguration } from 'swr/mutation';

export type { SWRMutationConfiguration, PostgrestError };

export type Operation = 'Insert' | 'UpdateOne' | 'Upsert' | 'Delete';

export type GetFetcherOptions<
  ClientOptions extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  O extends Operation,
  Relationships = T extends { Relationships: infer R } ? R : unknown,
> = O extends 'Insert'
  ? InsertFetcherOptions<ClientOptions, S, T, Relationships>
  : O extends 'UpdateOne'
    ? UpdateFetcherOptions<ClientOptions, S, T, Relationships>
    : O extends 'Upsert'
      ? UpsertFetcherOptions<ClientOptions, S, T, Relationships>
      : O extends 'Delete'
        ? DeleteFetcherOptions<ClientOptions, S, T, Relationships>
        : never;

export type GetInputType<
  T extends GenericTable,
  O extends Operation,
> = O extends 'Delete'
  ? Partial<T['Row']> | Partial<T['Row']>[]
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
    Q extends '*' ? '*' : Q,
    PostgrestClientOptions
  >,
> = O extends 'UpdateOne'
  ? R | null
  : O extends 'Delete'
    ? R | R[] | null
    : O extends 'Insert' | 'Upsert'
      ? R[] | null
      : never;

export type UsePostgrestSWRMutationOpts<
  O extends Operation,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Relationships = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<
    S,
    T['Row'],
    RelationName,
    Relationships,
    Q extends '*' ? '*' : Q,
    PostgrestClientOptions
  >,
> = RevalidateOpts<T['Row']> &
  Pick<SWRMutatorOptions, 'throwOnError' | 'revalidate'> &
  SWRMutationConfiguration<
    GetReturnType<O, S, T, RelationName, Relationships, Q, R>,
    PostgrestError,
    string,
    GetInputType<T, O>
  > &
  GetFetcherOptions<PostgrestClientOptions, S, T, O, Relationships>;

/**
 * Options for mutation hooks using single object argument pattern.
 */
export type UseMutationOptions<
  O extends Operation,
  ClientOptions extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Relationships = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<
    S,
    T['Row'],
    RelationName,
    Relationships,
    Q extends '*' ? '*' : Q,
    ClientOptions
  >,
> = {
  /** The PostgrestQueryBuilder instance for the table */
  query: PostgrestQueryBuilder<
    ClientOptions,
    S,
    T,
    RelationName,
    Relationships
  >;
  /** Array of primary key column names for the table */
  primaryKeys: (keyof T['Row'])[];
  /** Optional PostgREST query string for the RETURNING clause */
  returning?: Q | null;
} & RevalidateOpts<T['Row']> &
  Pick<SWRMutatorOptions, 'throwOnError' | 'revalidate'> &
  SWRMutationConfiguration<
    GetReturnType<O, S, T, RelationName, Relationships, Q, R>,
    PostgrestError,
    string,
    GetInputType<T, O>
  > &
  GetFetcherOptions<ClientOptions, S, T, O, Relationships>;
