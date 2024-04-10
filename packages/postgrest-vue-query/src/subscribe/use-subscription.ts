import { GenericTable } from '@supabase/postgrest-js/dist/module/types';
import {
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  SupabaseClient,
} from '@supabase/supabase-js';
import { RevalidateOpts } from '@supabase-cache-helpers/postgrest-core';
import { MutationOptions as VueQueryMutatorOptions } from '@tanstack/vue-query';
import { watchEffect, ref } from 'vue';

import { useDeleteItem, useUpsertItem } from '../cache';

/**
 * Options for the `useSubscription` hook.
 */
export type UseSubscriptionOpts<T extends GenericTable> = RevalidateOpts<
  T['Row']
> &
  VueQueryMutatorOptions & {
    callback?: (
      event: RealtimePostgresChangesPayload<T['Row']>,
    ) => void | Promise<void>;
  };

/**
 * Hook that sets up a real-time subscription to a Postgres database table.
 *
 * @param channel - The real-time channel to subscribe to.
 * @param filter - A filter that specifies the table and conditions for the subscription.
 * @param primaryKeys - An array of primary key column names for the table.
 * @param opts - Options for the mutation function used to upsert or delete rows in the cache.
 *
 * @returns An object containing the current status of the subscription.
 */
function useSubscription<T extends GenericTable>(
  client: SupabaseClient | null,
  channelName: string,
  filter: Omit<
    RealtimePostgresChangesFilter<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL}`>,
    'table'
  > & { table: string },
  primaryKeys: (keyof T['Row'])[],
  opts?: UseSubscriptionOpts<T>,
) {
  const statusRef = ref<string>();
  const deleteItem = useDeleteItem({
    ...opts,
    primaryKeys,
    table: filter.table,
    schema: filter.schema,
  });
  const upsertItem = useUpsertItem({
    ...opts,
    primaryKeys,
    table: filter.table,
    schema: filter.schema,
  });

  watchEffect(() => {
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
        },
      )
      .subscribe((status: string) => (statusRef.value = status));

    return () => {
      if (c) c.unsubscribe();
    };
  });

  return { status: statusRef };
}

export { useSubscription };
