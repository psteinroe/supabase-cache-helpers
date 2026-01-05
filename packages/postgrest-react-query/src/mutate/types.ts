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
  PostgrestClientOptions,
  PostgrestError,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import type { UseMutationOptions as TanstackUseMutationOptions } from '@tanstack/react-query';

export type Operation =
  | 'Insert'
  | 'UpdateOne'
  | 'Upsert'
  | 'DeleteOne'
  | 'DeleteMany';

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
      : O extends 'DeleteOne' | 'DeleteMany'
        ? DeleteFetcherOptions<ClientOptions, S, T, Relationships>
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
    Q extends '*' ? '*' : Q,
    PostgrestClientOptions
  >,
> = O extends 'UpdateOne'
  ? R | null
  : O extends 'DeleteOne'
    ? R | null
    : O extends 'Insert' | 'Upsert' | 'DeleteMany'
      ? R[] | null
      : never;

export type UsePostgrestMutationOpts<
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
  TanstackUseMutationOptions<
    GetReturnType<O, S, T, RelationName, Relationships, Q, R> | null,
    PostgrestError,
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
  Omit<
    TanstackUseMutationOptions<
      GetReturnType<O, S, T, RelationName, Relationships, Q, R> | null,
      PostgrestError,
      GetInputType<T, O>
    >,
    'mutationFn'
  > &
  GetFetcherOptions<ClientOptions, S, T, O, Relationships>;
