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

import { PostgrestSWRMutatorOpts } from "../lib";
import { isV1Response } from "./types";

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
  query: Q,
  primaryKeys: (keyof T["Row"])[],
  opts?: PostgrestSWRMutatorOpts<T> & {
    callback?: (
      event: RealtimePostgresChangesPayload<T["Row"]> & { data: T["Row"] | R }
    ) => void | Promise<void>;
  }
) {
  const [status, setStatus] = useState<string>();
  const [channel, setChannel] = useState<RealtimeChannel>();
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
          let eventType = payload.eventType;
          let newRecord = payload.new;
          let oldRecord = payload.old;
          if (isV1Response<T>(payload)) {
            eventType = payload.type;
            newRecord = payload.record;
            oldRecord = payload.old_record;
          }
          let data: T["Row"] | R = newRecord ?? oldRecord;
          if (eventType !== REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE) {
            const qb = client.from(payload.table).select(query);
            for (const pk of primaryKeys) {
              qb.eq(pk.toString(), data[pk]);
            }
            const res = await qb.single();
            if (res.data) data = res.data;
          }

          if (
            eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT ||
            eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE
          ) {
            await upsertItem(data);
          } else if (
            eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
          ) {
            await deleteItem(data);
          }
          if (opts?.callback) {
            // temporary workaround to make it work with both v1 and v2
            opts.callback({
              ...payload,
              data,
              new: newRecord,
              old: oldRecord,
              eventType,
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
