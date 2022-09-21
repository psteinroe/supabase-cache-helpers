import { useSWRConfig } from "swr";
import { useEffect, useState } from "react";
import {
  GenericTable,
  PostgrestSWRMutatorOpts,
  useCacheScanner,
  update,
  insert,
  remove,
} from "../lib";
import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SCHEMA_NAME } from "@supabase-cache-helpers/postgrest-shared";
import { Response, PostgresChangeFilter } from "./types";

function useSubscriptionQuery<T extends GenericTable, Q extends string = "*">(
  client: SupabaseClient | null,
  channelName: string,
  filter: PostgresChangeFilter,
  query: Q,
  primaryKeys: (keyof T["Row"])[],
  opts?: Omit<PostgrestSWRMutatorOpts<T>, "schema">
) {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner(filter.table, opts);
  const [status, setStatus] = useState<string>();
  const [channel, setChannel] = useState<RealtimeChannel>();

  useEffect(() => {
    if (!client) return;

    const schema = filter.schema ?? DEFAULT_SCHEMA_NAME;
    const c = client
      .channel(channelName)
      .on(
        "postgres_changes",
        { ...filter, schema },
        async (payload: Response<T>) => {
          const qb = client.from(filter.table).select(query);
          for (const pk of primaryKeys) {
            qb.eq(pk.toString(), (payload.record ?? payload.old_record)[pk]);
          }
          const { data } = await qb.single();
          if (data) {
            const keys = scan();
            if (payload.type === "INSERT") {
              await insert<T>([payload.record], keys, mutate, opts);
            } else if (payload.type === "UPDATE") {
              await update<T>(payload.record, primaryKeys, keys, mutate, opts);
            } else if (payload.type === "DELETE") {
              await remove<T>(
                payload.old_record,
                primaryKeys,
                keys,
                mutate,
                opts
              );
            }
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
