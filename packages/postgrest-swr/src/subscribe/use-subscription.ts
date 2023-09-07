import { PostgrestMutatorOpts } from '@supabase-cache-helpers/postgrest-core';
import { GenericTable } from '@supabase/postgrest-js/dist/module/types';
import {
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  SupabaseClient,
} from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { MutatorOptions as SWRMutatorOptions } from 'swr';

import { useDeleteItem, useUpsertItem } from '../cache';

/**
 * Options for `useSubscription` hook.
 */
export type UseSubscriptionOpts<T extends GenericTable> = PostgrestMutatorOpts<
  T['Row']
> &
  SWRMutatorOptions & {
    /**
     * A callback that will be invoked whenever a new change event is received.
     *
     * @param event - The change event payload.
     * @returns Optionally returns a Promise.
     */
    callback?: (
      event: RealtimePostgresChangesPayload<T['Row']>
    ) => void | Promise<void>;
  };

/**
 * A custom React hook for subscribing to a Supabase Realtime subscription.
 *
 * @param channel - The Realtime subscription channel to listen to.
 * @param filter - The filter to apply on the table. Must include the table name.
 * @param primaryKeys - An array of primary key column names for the table.
 * @param opts - Additional options for the hook.
 * @returns An object containing the subscription status.
 */
function useSubscription<T extends GenericTable>(
  client: SupabaseClient | null,
  channelName: string,
  filter: Omit<
    RealtimePostgresChangesFilter<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL}`>,
    'table'
  > & { table: string },
  primaryKeys: (keyof T['Row'])[],
  opts?: UseSubscriptionOpts<T>
) {
  const [status, setStatus] = useState<string>();
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
          if (
            payload.eventType ===
              REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT ||
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE
          ) {
            console.log('upsert item');
            await upsertItem(payload.new);
          } else if (
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
          ) {
            await deleteItem(payload.old);
          }
          if (opts?.callback) {
            opts.callback({
              ...payload,
            });
          }
        }
      )
      .subscribe((status: string) => setStatus(status));

    return () => {
      if (c) c.unsubscribe();
    };
  }, []);

  return { status };
}

export { useSubscription };
