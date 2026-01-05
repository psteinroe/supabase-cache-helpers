import { useRevalidateForDelete, useRevalidateForUpsert } from '../cache';
import type { RevalidateOpts } from '@supabase-cache-helpers/postgrest-core';
import type { GenericTable } from '@supabase-cache-helpers/postgrest-core';
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  type RealtimePostgresChangesFilter,
  type RealtimePostgresChangesPayload,
  type SupabaseClient,
} from '@supabase/supabase-js';
import type { MutationOptions as ReactQueryMutatorOptions } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * Options for the `useSubscription` hook.
 */
export type UseSubscriptionOpts<T extends GenericTable> = {
  /** The Supabase client instance */
  client: SupabaseClient | null;
  /** The name of the channel to subscribe to */
  channel: string;
  /** The type of event to listen to */
  event: `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`;
  /** The schema to listen to */
  schema?: string;
  /** The table to listen to */
  table: string;
  /** Optional filter expression */
  filter?: string;
  /** Array of primary key column names for the table */
  primaryKeys: (keyof T['Row'])[];
  /**
   * A callback that will be invoked whenever a new change event is received.
   *
   * @param event - The change event payload.
   * @returns Optionally returns a Promise.
   */
  callback?: (
    event: RealtimePostgresChangesPayload<T['Row']>,
  ) => void | Promise<void>;
} & RevalidateOpts<T['Row']> &
  ReactQueryMutatorOptions;

/**
 * Hook that sets up a real-time subscription to a Postgres database table.
 *
 * @param opts - Options for the subscription.
 * @returns An object containing the current status of the subscription.
 *
 * @example
 * ```tsx
 * const { status } = useSubscription({
 *   client,
 *   channel: 'my-channel',
 *   event: '*',
 *   schema: 'public',
 *   table: 'contact',
 *   primaryKeys: ['id'],
 *   callback: (payload) => console.log(payload)
 * });
 * ```
 */
function useSubscription<T extends GenericTable>(opts: UseSubscriptionOpts<T>) {
  const {
    client,
    channel,
    event,
    schema,
    table,
    filter: filterExpression,
    primaryKeys,
    callback,
    ...rest
  } = opts;

  const [status, setStatus] = useState<string>();
  const revalidateForDelete = useRevalidateForDelete({
    ...rest,
    primaryKeys,
    table,
    schema: schema || 'public',
  });
  const revalidateForUpsert = useRevalidateForUpsert({
    ...rest,
    primaryKeys,
    table,
    schema: schema || 'public',
  });

  useEffect(() => {
    if (!client) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (client.channel(channel) as any)
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        { event, schema: schema || 'public', table, filter: filterExpression },
        async (payload: RealtimePostgresChangesPayload<T['Row']>) => {
          if (
            payload.eventType ===
              REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT ||
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE
          ) {
            await revalidateForUpsert(payload.new);
          } else if (
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
          ) {
            await revalidateForDelete(payload.old);
          }
          if (callback) {
            callback({
              ...payload,
            });
          }
        },
      )
      .subscribe((status: string) => setStatus(status));

    return () => {
      if (c) c.unsubscribe();
    };
  }, [
    client,
    channel,
    event,
    schema,
    table,
    filterExpression,
    callback,
    revalidateForUpsert,
    revalidateForDelete,
  ]);

  return { status };
}

export { useSubscription };
