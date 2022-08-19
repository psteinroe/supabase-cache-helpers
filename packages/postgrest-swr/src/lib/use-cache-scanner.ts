import { DEFAULT_SCHEMA_NAME } from "@supabase-cache-helpers/postgrest-shared";
import { useSWRConfig } from "swr";
import { decode, POSTGREST_FILTER_KEY_PREFIX, KEY_SEPARATOR } from ".";
import { GenericTable, PostgrestSWRMutatorOpts } from "./types";
import {
  encodeObject,
  PostgrestFilter,
  PostgrestQueryParserOptions,
} from "@supabase-cache-helpers/postgrest-filter";

export const isMap = (v: unknown): v is Map<unknown, unknown> =>
  typeof (v as Map<unknown, unknown>).keys === "function";

export const useCacheScanner = <
  Table extends GenericTable,
  Operation extends "Insert" | "Update" | "Delete"
>(
  table: string,
  opts?: PostgrestSWRMutatorOpts<Table, Operation>
) => {
  const { cache } = useSWRConfig();

  const getPostgrestFilter = (
    query: string,
    opts?: PostgrestQueryParserOptions
  ) => {
    const key = [
      POSTGREST_FILTER_KEY_PREFIX,
      query,
      opts ? encodeObject(opts) : null,
    ]
      .filter(Boolean)
      .join(KEY_SEPARATOR);
    const cachedFilter = cache.get(key);
    if (cachedFilter && cachedFilter instanceof PostgrestFilter)
      return cachedFilter;
    const filter = PostgrestFilter.fromQuery(query, opts);
    cache.set(key, filter);
    return filter;
  };

  return () => {
    const keysToMutate = [];
    const keysToRevalidateRelation = [];
    const keysToRevalidateTable = [];

    for (const k of isMap(cache) ? cache.keys() : []) {
      const key = decode(k);

      // Exit early if not a postgrest key
      if (!key) continue;

      if (
        key.schema === (opts?.schema ?? DEFAULT_SCHEMA_NAME) &&
        key.table === table
      ) {
        keysToMutate.push({
          ...key,
          filter: getPostgrestFilter(key.query),
        });
      }

      for (const r of opts?.revalidateRelations ?? []) {
        if (
          (r.schema ?? DEFAULT_SCHEMA_NAME) === key.schema &&
          r.relation === key.table
        ) {
          keysToRevalidateRelation.push({
            ...key,
            ...r,
            filter: getPostgrestFilter(key.query, {
              exclusivePaths: [r.relationIdColumn],
            }),
          });
        }
      }
      if (
        opts?.revalidateTables?.find(
          (t) =>
            (t.schema ?? DEFAULT_SCHEMA_NAME) === key.schema &&
            t.table === key.table
        )
      ) {
        keysToRevalidateTable.push({
          ...key,
        });
      }
    }
    return {
      keysToMutate,
      keysToRevalidateRelation,
      keysToRevalidateTable,
    };
  };
};
