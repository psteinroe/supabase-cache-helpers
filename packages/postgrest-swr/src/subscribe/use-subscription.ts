import { useSWRConfig } from "swr";
import { useEffect, useState } from "react";
import {
  decode,
  getCacheKeys,
  PostgrestSWRMutatorOpts,
  usePostgrestFilterCache,
} from "../lib";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Response, PostgresChangeFilter } from "./types";
import { GenericTable } from "@supabase-cache-helpers/postgrest-shared";
import {
  insertItem,
  updateItem,
  deleteItem,
} from "@supabase-cache-helpers/postgrest-mutate";

function useSubscription<T extends GenericTable>(
  channel: RealtimeChannel | null,
  filter: PostgresChangeFilter,
  primaryKeys: (keyof T["Row"])[],
  opts?: PostgrestSWRMutatorOpts<T> & {
    callback?: (event: Response<T>) => void | Promise<void>;
  }
) {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    if (!channel) return;

    const c = channel
      .on("postgres_changes", filter, async (payload: Response<T>) => {
        if (payload.type === "INSERT") {
          await insertItem(
            {
              input: payload.record,
              table: payload.table,
              schema: payload.schema,
              opts,
            },
            {
              cacheKeys: getCacheKeys(cache),
              decode,
              getPostgrestFilter,
              mutate,
            }
          );
        } else if (payload.type === "UPDATE") {
          await updateItem(
            {
              primaryKeys,
              input: payload.record,
              table: payload.table,
              schema: payload.schema,
              opts,
            },
            {
              cacheKeys: getCacheKeys(cache),
              decode,
              getPostgrestFilter,
              mutate,
            }
          );
        } else if (payload.type === "DELETE") {
          await deleteItem(
            {
              primaryKeys,
              input: payload.old_record,
              table: payload.table,
              schema: payload.schema,
              opts,
            },
            {
              cacheKeys: getCacheKeys(cache),
              decode,
              getPostgrestFilter,
              mutate,
            }
          );
        }
        if (opts?.callback) opts.callback(payload);
      })
      .subscribe((status: string) => setStatus(status));
    return () => {
      if (c) c.unsubscribe();
    };
  }, []);

  return { status };
}

export { useSubscription };
