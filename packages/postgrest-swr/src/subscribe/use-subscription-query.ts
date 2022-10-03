import { useSWRConfig } from "swr";
import { useEffect, useState } from "react";
import {
  decode,
  getCacheKeys,
  PostgrestSWRMutatorOpts,
  usePostgrestFilterCache,
} from "../lib";
import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { Response, PostgresChangeFilter } from "./types";
import { GenericTable } from "@supabase-cache-helpers/postgrest-shared";
import {
  insertItem,
  updateItem,
  deleteItem,
} from "@supabase-cache-helpers/postgrest-mutate";

function useSubscriptionQuery<T extends GenericTable, Q extends string = "*">(
  client: SupabaseClient | null,
  channelName: string,
  filter: PostgresChangeFilter,
  query: Q,
  primaryKeys: (keyof T["Row"])[],
  opts?: Omit<PostgrestSWRMutatorOpts<T>, "schema">
) {
  const { mutate, cache } = useSWRConfig();
  const getPostgrestFilter = usePostgrestFilterCache();
  const [status, setStatus] = useState<string>();
  const [channel, setChannel] = useState<RealtimeChannel>();

  useEffect(() => {
    if (!client) return;

    const c = client
      .channel(channelName)
      .on("postgres_changes", filter, async (payload: Response<T>) => {
        let data = payload.record ?? payload.old_record;
        if (payload.type !== "DELETE") {
          const qb = client.from(filter.table).select(query);
          for (const pk of primaryKeys) {
            qb.eq(pk.toString(), payload.record[pk]);
          }
          const res = await qb.single();
          if (res.data) data = res.data;
        }

        if (data) {
          if (payload.type === "INSERT") {
            await insertItem(
              {
                input: data,
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
                input: data,
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
                input: data,
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
        }
      })
      .subscribe((status: string) => setStatus(status));

    setChannel(c);

    return () => {
      if (c) c.unsubscribe();
    };
  }, []);

  return { channel, status };
}

export { useSubscriptionQuery };
