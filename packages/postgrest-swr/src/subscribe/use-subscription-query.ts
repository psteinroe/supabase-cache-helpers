import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';
import {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  SupabaseClient,
} from '@supabase/supabase-js';
import {
  buildNormalizedQuery,
  PostgrestMutatorOpts,
  QueryWithoutWildcard,
} from '@supabase-cache-helpers/postgrest-core';
import { useEffect, useState } from 'react';
import { MutatorOptions as SWRMutatorOptions } from 'swr';

import { useDeleteItem, useUpsertItem } from '../cache';
import { useQueriesForTableLoader } from '../lib';

/**
 * Options for the useSubscriptionQuery hook.
 */
export type UseSubscriptionQueryOpts<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Re, Q extends '*' ? '*' : Q>,
> = PostgrestMutatorOpts<T['Row']> &
  SWRMutatorOptions & {
    /**
     * A callback that will be called whenever a realtime event occurs for the given channel.
     * The callback will receive the event payload with an additional "data" property, which will be
     * the affected row of the event (or a modified version of it, if a select query is provided).
     */
    callback?: (
      event: RealtimePostgresChangesPayload<T['Row']> & { data: T['Row'] | R },
    ) => void | Promise<void>;
  };

/**
 * A hook for subscribing to realtime Postgres events on a given channel.
 *
 * The subscription will automatically update the cache for the specified table in response
 * to incoming Postgres events, and optionally run a user-provided callback function with the
 * event and the updated data.
 *
 * This hook works by creating a Supabase Realtime channel for the specified table and
 * subscribing to Postgres changes on that channel. When an event is received, the hook
 * fetches the updated data from the database (using a `select` query generated from the cache
 * configuration), and then updates the cache accordingly.
 *
 * @param client - The Supabase client instance.
 * @param channelName - The name of the channel to subscribe to.
 * @param filter - The filter object to use when listening for changes.
 * @param primaryKeys - An array of the primary keys for the table being listened to.
 * @param query - An optional PostgREST query to use when selecting data for an event.
 * @param opts - Additional options to pass to the hook.
 * @returns An object containing the RealtimeChannel and the current status of the subscription.
 */
function useSubscriptionQuery<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Re, Q extends '*' ? '*' : Q>,
>(
  client: SupabaseClient | null,
  channelName: string,
  filter: Omit<
    RealtimePostgresChangesFilter<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL}`>,
    'table'
  > & { table: string },
  primaryKeys: (keyof T['Row'])[],
  query?: QueryWithoutWildcard<Q> | null,
  opts?: UseSubscriptionQueryOpts<S, T, Re, Q, R>,
) {
  const [status, setStatus] = useState<string>();
  const [channel, setChannel] = useState<RealtimeChannel>();
  const queriesForTable = useQueriesForTableLoader(filter.table);
  const deleteItem = useDeleteItem({
    primaryKeys,
    table: filter.table,
    schema: filter.schema,
    opts,
    ...opts,
  });
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: filter.table,
    schema: filter.schema,
    opts,
    ...opts,
  });

  useEffect(() => {
    if (!client) return;

    const c = client
      .channel(channelName)
      .on<T['Row']>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        filter,
        async (payload) => {
          let data: T['Row'] | R = payload.new ?? payload.old;
          const selectQuery = buildNormalizedQuery({ queriesForTable, query });
          if (
            payload.eventType !==
              REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE &&
            selectQuery
          ) {
            const qb = client
              .from(payload.table)
              .select(selectQuery.selectQuery);
            for (const pk of primaryKeys) {
              qb.eq(pk.toString(), data[pk]);
            }
            const res = await qb.single();
            if (res.data) data = res.data as R;
          }

          if (
            payload.eventType ===
              REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT ||
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE
          ) {
            await upsertItem(data as Record<string, unknown>);
          } else if (
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
          ) {
            await deleteItem(data as Record<string, unknown>);
          }
          if (opts?.callback) {
            opts.callback({
              ...payload,
              data,
            });
          }
        },
      )
      .subscribe((status: string) => setStatus(status));

    setChannel(c);

    return () => {
      if (c) c.unsubscribe();
    };
  }, []);

  return { channel, status };
}

export { useSubscriptionQuery };
