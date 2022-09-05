import { useSWRConfig } from "swr";
import { useEffect, useId } from "react";
import {
  GenericTable,
  PostgrestSWRMutatorOpts,
  useCacheScanner,
  update,
  insert,
  remove,
} from "../lib";
import { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SCHEMA_NAME } from "@supabase-cache-helpers/postgrest-shared";
import { Response, PostgresChangeFilter } from "./types";

function useSubscriptionQuery<T extends GenericTable, Q extends string = "*">(
  client: SupabaseClient | null,
  channel: string,
  filter: PostgresChangeFilter,
  query: Q,
  primaryKeys: (keyof T["Row"])[],
  opts?: Omit<PostgrestSWRMutatorOpts<T>, "schema">
) {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner(filter.table, opts);

  useEffect(() => {
    if (!client) return;

    const subscription = client
      .channel(channel)
      .on(
        "postgres_change",
        { ...filter, schema: filter.schema ?? DEFAULT_SCHEMA_NAME },
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
      .subscribe();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);
}

export { useSubscriptionQuery };
