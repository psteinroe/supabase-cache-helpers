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
import { Response, PostgresChangeFilter } from "./types";
import { DEFAULT_SCHEMA_NAME } from "@supabase-cache-helpers/postgrest-shared";

function useSubscription<T extends GenericTable>(
  channel: RealtimeChannel | null,
  filter: PostgresChangeFilter,
  primaryKeys: (keyof T["Row"])[],
  opts?: Omit<PostgrestSWRMutatorOpts<T>, "schema">
) {
  const { mutate } = useSWRConfig();
  const scan = useCacheScanner(filter.table, opts);
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    if (!channel) return;

    const schema = filter.schema ?? DEFAULT_SCHEMA_NAME;
    const c = channel
      .on(
        "postgres_changes",
        { ...filter, schema },
        async (payload: Response<T>) => {
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
      )
      .subscribe((status: string) => setStatus(status));

    return () => {
      if (c) c.unsubscribe();
    };
  }, []);

  return { status };
}

export { useSubscription };
