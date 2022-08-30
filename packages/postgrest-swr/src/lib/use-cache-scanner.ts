import {
  DEFAULT_SCHEMA_NAME,
  RevalidateRelationOpt,
} from "@supabase-cache-helpers/postgrest-shared";
import { useSWRConfig, Cache } from "swr";
import {
  decode,
  POSTGREST_FILTER_KEY_PREFIX,
  KEY_SEPARATOR,
  PostgrestSWRKey,
} from ".";
import { GenericTable, Operation, PostgrestSWRMutatorOpts } from "./types";
import {
  encodeObject,
  PostgrestFilter,
  PostgrestQueryParserOptions,
} from "@supabase-cache-helpers/postgrest-filter";

export const isMap = (v: unknown): v is Map<unknown, unknown> =>
  typeof (v as Map<unknown, unknown>).keys === "function";

const getPostgrestFilter = (
  query: string,
  cache: Cache,
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

export type CacheScanResult<T extends GenericTable> = {
  keysToMutate: (PostgrestSWRKey & {
    filter: PostgrestFilter<Partial<T["Row"]>>;
  })[];
  keysToRevalidateRelation: (PostgrestSWRKey &
    RevalidateRelationOpt<T["Row"]> & {
      filter: PostgrestFilter<Partial<T["Row"]>>;
    })[];
  keysToRevalidateTable: PostgrestSWRKey[];
};

export const useCacheScanner = <T extends GenericTable, O extends Operation>(
  table: string,
  opts?: Pick<
    PostgrestSWRMutatorOpts<T, O>,
    "schema" | "revalidateRelations" | "revalidateTables"
  >
) => {
  const { cache } = useSWRConfig();

  return () => {
    const keysToMutate: CacheScanResult<T>["keysToMutate"] = [];
    const keysToRevalidateRelation: CacheScanResult<T>["keysToRevalidateRelation"] =
      [];
    const keysToRevalidateTable: CacheScanResult<T>["keysToRevalidateTable"] =
      [];

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
          filter: getPostgrestFilter(key.query, cache),
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
            filter: getPostgrestFilter(key.query, cache, {
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
