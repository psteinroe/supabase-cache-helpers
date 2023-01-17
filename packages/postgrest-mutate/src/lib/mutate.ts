import {
  PostgrestFilter,
  PostgrestQueryParserOptions,
} from "@supabase-cache-helpers/postgrest-filter";

import { buildDeleteMutatorFn } from "./build-delete-mutator-fn";
import { buildUpsertMutatorFn } from "./build-upsert-mutator-fn";
import { DecodedKey, MutatorFn, PostgrestMutatorOpts } from "./types";

export type OperationType = "UPSERT" | "DELETE";

/**
 * Defines the operation
 */
export type Operation<Type extends Record<string, unknown>> = {
  table: string;
  schema: string;
  input: Type;
  opts?: PostgrestMutatorOpts<Type>;
  type: "UPSERT" | "DELETE";
  primaryKeys: (keyof Type)[];
};

export type Cache<KeyType, Type extends Record<string, unknown>> = {
  /**
   * The keys currently present in the cache
   */
  cacheKeys: KeyType[];
  /**
   * Should return a PostgrestFilter for the given query.
   * This is exposed as a function so results can be cached by the cache library.
   */
  getPostgrestFilter: (
    query: string,
    opts?: PostgrestQueryParserOptions
  ) => Pick<PostgrestFilter<Type>, "apply" | "hasPaths" | "applyFilters">;
  /**
   * Decode a key. Should return null if not a PostgREST key.
   */
  decode: (k: KeyType) => DecodedKey | null;
  /**
   * The mutation function from the cache library
   */
  mutate: (key: KeyType, fn?: MutatorFn<Type>) => Promise<void>;
};

export const mutate = async <KeyType, Type extends Record<string, unknown>>(
  op: Operation<Type>,
  cache: Cache<KeyType, Type>
) => {
  const { input, type, opts, schema, table } = op;
  const { cacheKeys, decode, getPostgrestFilter, mutate } = cache;

  const mutations = [];
  for (const k of cacheKeys) {
    const key = decode(k);

    // Exit early if not a postgrest key
    if (!key) continue;
    if (key.schema === schema && key.table === table) {
      let filter:
        | Pick<PostgrestFilter<Type>, "apply" | "hasPaths" | "applyFilters">
        | undefined;
      // For upsert, the input has to have either all required paths or all required filters

      if (
        type === "UPSERT" &&
        (filter = getPostgrestFilter(key.queryKey)) &&
        (filter.hasPaths(input) || filter.applyFilters(input))
      ) {
        mutations.push(
          mutate(
            k,
            buildUpsertMutatorFn(
              input,
              op.primaryKeys as (keyof Type)[],
              filter
            )
          )
        );
        // For upsert, the input has to have a value for all primary keys
      } else if (
        type === "DELETE" &&
        op.primaryKeys.every((pk) => typeof input[pk] !== "undefined")
      ) {
        mutations.push(
          mutate(
            k,
            buildDeleteMutatorFn(input, op.primaryKeys as (keyof Type)[])
          )
        );
      }
    }

    for (const r of opts?.revalidateRelations ?? []) {
      if (
        r.schema === key.schema &&
        r.relation === key.table &&
        getPostgrestFilter(key.queryKey, {
          exclusivePaths: [r.relationIdColumn],
        }).applyFilters({
          [r.relationIdColumn]: input[r.fKeyColumn],
        })
      ) {
        mutations.push(mutate(k));
      }
    }

    if (
      opts?.revalidateTables?.find(
        (t) => t.schema === key.schema && t.table === key.table
      )
    ) {
      mutations.push(mutate(k));
    }
  }
  await Promise.all(mutations);
};
