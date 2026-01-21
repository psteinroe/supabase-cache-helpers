import { useRevalidateForDelete, useRevalidateForUpsert } from '../cache';
import { useQueriesForTableLoader } from '../lib';
import { useRealtimeSubscription } from './use-realtime-subscription';
import {
  type RevalidateOpts,
  buildNormalizedQuery,
  normalizeResponse,
  GenericSchema,
  GenericTable,
} from '@supabase-cache-helpers/postgrest-core';
import {
  UnstableGetResult as GetResult,
  PostgrestClientOptions,
} from '@supabase/postgrest-js';
import {
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  type RealtimePostgresChangesPayload,
  type SupabaseClient,
} from '@supabase/supabase-js';
import type { MutationOptions as ReactQueryMutatorOptions } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Options for `useSubscriptionQuery` hook
 */
export type UseSubscriptionQueryOpts<
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<
    S,
    T['Row'],
    RelationName,
    Re,
    Q extends '*' ? '*' : Q,
    PostgrestClientOptions
  >,
> = {
  /** The Supabase client instance */
  client: SupabaseClient | null;
  /** The name of the channel to subscribe to */
  channel: string;
  /** The type of event to listen to */
  event: `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`;
  /** The schema to listen to */
  schema?: string;
  /** The table to listen to */
  table: RelationName;
  /** Optional filter expression */
  filter?: string;
  /** Array of primary key column names for the table */
  primaryKeys: (keyof T['Row'])[];
  /** Optional PostgREST query to use when selecting data for an event */
  returning?: Q extends '*' ? "'*' is not allowed" : Q | null;
  /**
   * A callback that will be called whenever a realtime event occurs for the given channel.
   * The callback will receive the event payload with an additional "data" property, which will be
   * the affected row of the event (or a modified version of it, if a returning query is provided).
   */
  callback?: (
    event: RealtimePostgresChangesPayload<T['Row']> & { data: T['Row'] | R },
  ) => void | Promise<void>;
} & RevalidateOpts<T['Row']> &
  ReactQueryMutatorOptions;

/**
 * A hook for subscribing to realtime Postgres events on a given channel.
 *
 * The subscription will automatically update the cache for the specified table in response
 * to incoming Postgres events, and optionally run a user-provided callback function with the
 * event and the updated data.
 *
 * @param opts - Options for the subscription.
 * @returns An object containing the RealtimeChannel and the current status of the subscription.
 *
 * @example
 * ```tsx
 * const { channel, status } = useSubscriptionQuery({
 *   client,
 *   channel: 'my-channel',
 *   event: '*',
 *   schema: 'public',
 *   table: 'contact',
 *   primaryKeys: ['id'],
 *   returning: 'id,name',
 *   callback: (payload) => console.log(payload)
 * });
 * ```
 */
function useSubscriptionQuery<
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<
    S,
    T['Row'],
    RelationName,
    Re,
    Q extends '*' ? '*' : Q,
    PostgrestClientOptions
  >,
>(opts: UseSubscriptionQueryOpts<S, T, RelationName, Re, Q, R>) {
  const {
    client,
    channel: channelName,
    event,
    schema = 'public',
    table,
    filter,
    primaryKeys,
    returning,
    callback,
    ...rest
  } = opts;

  const queriesForTable = useQueriesForTableLoader(table);
  const revalidateForDelete = useRevalidateForDelete({
    ...rest,
    primaryKeys,
    table,
    schema,
  });
  const revalidateForUpsert = useRevalidateForUpsert({
    ...rest,
    primaryKeys,
    table,
    schema,
  });

  const onPayload = useCallback(
    async (payload: RealtimePostgresChangesPayload<T['Row']>) => {
      let data: T['Row'] | R = (payload.new ?? payload.old) as T['Row'];
      const selectQuery = buildNormalizedQuery({
        queriesForTable,
        query: returning,
      });

      if (
        client &&
        payload.eventType !== REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE &&
        selectQuery
      ) {
        const qb = client.from(payload.table).select(selectQuery.selectQuery);
        for (const pk of primaryKeys) {
          qb.eq(pk.toString(), (data as T['Row'])[pk]);
        }
        const res = await qb.single();
        if (res.data) {
          data = normalizeResponse(selectQuery.groupedPaths, res.data) as R;
        }
      }

      if (
        payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT ||
        payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE
      ) {
        await revalidateForUpsert(data as Record<string, unknown>);
      } else if (
        payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
      ) {
        await revalidateForDelete(payload.old);
      }

      if (callback) {
        callback({ ...payload, data });
      }
    },
    [
      client,
      queriesForTable,
      returning,
      primaryKeys,
      revalidateForUpsert,
      revalidateForDelete,
      callback,
    ],
  );

  return useRealtimeSubscription<T['Row']>({
    client,
    channel: channelName,
    event,
    schema,
    table,
    filter,
    onPayload,
  });
}

export { useSubscriptionQuery };
