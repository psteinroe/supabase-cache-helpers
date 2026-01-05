import {
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  type RealtimeChannel,
  type RealtimePostgresChangesPayload,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { useEffect, useState, useRef } from 'react';

/**
 * Base options for realtime subscriptions.
 */
export type UseRealtimeSubscriptionOpts<Row extends Record<string, unknown>> = {
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
  /**
   * A callback that will be invoked whenever a new change event is received.
   */
  onPayload: (
    payload: RealtimePostgresChangesPayload<Row>,
  ) => void | Promise<void>;
};

/**
 * Base hook for subscribing to Supabase Realtime postgres changes.
 * This hook only handles the subscription - it does not revalidate cache.
 *
 * @internal
 */
export function useRealtimeSubscription<Row extends Record<string, unknown>>(
  opts: UseRealtimeSubscriptionOpts<Row>,
) {
  const {
    client,
    channel: channelName,
    event,
    schema = 'public',
    table,
    filter: filterExpression,
    onPayload,
  } = opts;

  const [status, setStatus] = useState<string>();
  const [channel, setChannel] = useState<RealtimeChannel>();

  // Use ref to avoid callback in dependency array
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  useEffect(() => {
    if (!client) return;

    const c = (client.channel(channelName) as ReturnType<typeof client.channel>)
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        { event, schema, table, filter: filterExpression },
        (payload: RealtimePostgresChangesPayload<Row>) => {
          onPayloadRef.current(payload);
        },
      )
      .subscribe((status: string) => setStatus(status));

    setChannel(c);

    return () => {
      if (c) c.unsubscribe();
    };
  }, [client, channelName, event, schema, table, filterExpression]);

  return { channel, status };
}
