import { useRevalidateForDelete, useRevalidateForUpsert } from '../cache';
import { useRealtimeSubscription } from './use-realtime-subscription';
import type { RevalidateOpts } from '@supabase-cache-helpers/postgrest-core';
import { GenericTable } from '@supabase-cache-helpers/postgrest-core';
import {
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  type RealtimePostgresChangesPayload,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { useCallback } from 'react';
import type { MutatorOptions as SWRMutatorOptions } from 'swr';

/**
 * Options for `useSubscription` hook.
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
  SWRMutatorOptions;

/**
 * A custom React hook for subscribing to a Supabase Realtime subscription.
 *
 * @param opts - Options for the subscription.
 * @returns An object containing the subscription status.
 *
 * @example
 * ```tsx
 * const status = useSubscription({
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
    schema = 'public',
    table,
    filter,
    primaryKeys,
    callback,
    ...rest
  } = opts;

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
      if (
        payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT ||
        payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE
      ) {
        await revalidateForUpsert(payload.new);
      } else if (
        payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
      ) {
        await revalidateForDelete(payload.old);
      }
      if (callback) {
        callback(payload);
      }
    },
    [revalidateForUpsert, revalidateForDelete, callback],
  );

  return useRealtimeSubscription<T['Row']>({
    client,
    channel,
    event,
    schema,
    table,
    filter,
    onPayload,
  });
}

export { useSubscription };
