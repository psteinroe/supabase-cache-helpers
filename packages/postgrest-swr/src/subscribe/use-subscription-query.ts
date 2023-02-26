import { loadQuery } from "@supabase-cache-helpers/postgrest-fetcher";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";
import {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  SupabaseClient,
} from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { useDeleteItem, useUpsertItem } from "../cache";
import { PostgrestSWRMutatorOpts, useQueriesForTableLoader } from "../lib";

function useSubscriptionQuery<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
>(
  client: SupabaseClient | null,
  channelName: string,
  filter: Omit<
    RealtimePostgresChangesFilter<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL}`>,
    "table"
  > & { table: string },
  query: Q extends "*" ? "'*' is not allowed" : Q,
  primaryKeys: (keyof T["Row"])[],
  opts?: PostgrestSWRMutatorOpts<T> & {
    callback?: (
      event: RealtimePostgresChangesPayload<T["Row"]> & { data: T["Row"] | R }
    ) => void | Promise<void>;
  }
) {
  const [status, setStatus] = useState<string>();
  const [channel, setChannel] = useState<RealtimeChannel>();
  const queriesForTable = useQueriesForTableLoader(filter.table);
  const deleteItem = useDeleteItem({
    primaryKeys,
    table: filter.table,
    schema: filter.schema,
    opts,
  });
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: filter.table,
    schema: filter.schema,
    opts,
  });

  useEffect(() => {
    if (!client) return;

    const c = client
      .channel(channelName)
      .on<T["Row"]>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        filter,
        async (payload) => {
          let data: T["Row"] | R = payload.new ?? payload.old;
          const selectQuery = loadQuery({ queriesForTable, query });
          if (
            payload.eventType !==
              REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE &&
            selectQuery
          ) {
            const qb = client.from(payload.table).select(selectQuery);
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
        }
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
