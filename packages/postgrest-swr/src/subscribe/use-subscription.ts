import {
  upsertItem,
  deleteItem,
} from "@supabase-cache-helpers/postgrest-mutate";
import { GenericTable } from "@supabase/postgrest-js/dist/module/types";
import {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
} from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";

import {
  decode,
  PostgrestSWRMutatorOpts,
  usePostgrestFilterCache,
} from "../lib";

function useSubscription<T extends GenericTable>(
  channel: RealtimeChannel | null,
  filter: RealtimePostgresChangesFilter<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL}`>,
  primaryKeys: (keyof T["Row"])[],
  opts?: PostgrestSWRMutatorOpts<T> & {
    callback?: (
      event: RealtimePostgresChangesPayload<T["Row"]>
    ) => void | Promise<void>;
  }
) {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (!channel) return;

    const c = channel
      .on<T["Row"]>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        filter,
        async (payload) => {
          console.log(payload);
          if (
            payload.eventType ===
              REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT ||
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE
          ) {
            await upsertItem(
              {
                primaryKeys,
                input: payload.new,
                table: payload.table,
                schema: payload.schema,
                opts,
              },
              {
                cacheKeys: Array.from(cache.keys()),
                decode,
                getPostgrestFilter,
                mutate,
              }
            );
          } else if (
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
          ) {
            await deleteItem(
              {
                primaryKeys,
                input: payload.old,
                table: payload.table,
                schema: payload.schema,
                opts,
              },
              {
                cacheKeys: Array.from(cache.keys()),
                decode,
                getPostgrestFilter,
                mutate,
              }
            );
          }
          if (opts?.callback) opts.callback(payload);
        }
      )
      .subscribe((status, err) => {
        setStatus(status);
        setError(err);
      });

    return () => {
      if (c) c.unsubscribe();
    };
  }, []);

  return { status, error };
}

export { useSubscription };
