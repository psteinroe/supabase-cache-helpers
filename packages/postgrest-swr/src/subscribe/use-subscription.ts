import { GenericTable } from "@supabase/postgrest-js/dist/module/types";
import {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
} from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useDeleteItem, useUpsertItem } from "../cache";

import { PostgrestSWRMutatorOpts } from "../lib";
import { isV1Response } from "./types";

function useSubscription<T extends GenericTable>(
  channel: RealtimeChannel | null,
  filter: Omit<
    RealtimePostgresChangesFilter<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL}`>,
    "table"
  > & { table: string },
  primaryKeys: (keyof T["Row"])[],
  opts?: PostgrestSWRMutatorOpts<T> & {
    callback?: (
      event: RealtimePostgresChangesPayload<T["Row"]>
    ) => void | Promise<void>;
  }
) {
  const [status, setStatus] = useState<string>();
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
    if (!channel) return;

    const c = channel
      .on<T["Row"]>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        filter,
        async (payload) => {
          // temporary workaround to make it work with both v1 and v2
          let eventType = payload.eventType;
          let newRecord = payload.new;
          let oldRecord = payload.old;
          if (isV1Response<T>(payload)) {
            eventType = payload.type;
            newRecord = payload.record;
            oldRecord = payload.old_record;
          }
          if (
            eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT ||
            eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE
          ) {
            await upsertItem(newRecord);
          } else if (
            eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
          ) {
            await deleteItem(oldRecord);
          }
          if (opts?.callback) {
            // temporary workaround to make it work with both v1 and v2
            opts.callback({
              ...payload,
              new: newRecord,
              old: oldRecord,
              eventType,
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
