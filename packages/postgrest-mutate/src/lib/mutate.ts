import {
  PostgrestFilter,
  PostgrestQueryParserOptions,
} from "@supabase-cache-helpers/postgrest-filter";
import {
  PostgrestMutatorOpts,
  DecodedKey,
} from "@supabase-cache-helpers/postgrest-shared";
import { MutatorFn } from "./types";
import { buildDeleteMutatorFn } from "./build-delete-mutator-fn";
import { buildInsertMutatorFn } from "./build-insert-mutator-fn";
import { buildUpdateMutatorFn } from "./build-update-mutator-fn";
import { buildUpsertMutatorFn } from "./build-upsert-mutator-fn";

export type OperationType = "INSERT" | "UPDATE" | "UPSERT" | "DELETE";

/**
 * Defines the operation
 */
export type Operation<
  Type extends Record<string, unknown>,
  Op extends OperationType
> = {
  table: string;
  schema: string;
  input: Type;
  opts?: PostgrestMutatorOpts<Type>;
} & (Op extends "INSERT"
  ? { type: "INSERT" }
  : { type: "UPDATE" | "UPSERT" | "DELETE"; primaryKeys: (keyof Type)[] });

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

export const mutate = async <
  KeyType,
  Type extends Record<string, unknown>,
  OpType extends OperationType
>(
  op: Operation<Type, OpType>,
  cache: Cache<KeyType, Type>
) => {
  const { input, type, opts, schema, table } = op;
  const { cacheKeys, decode, getPostgrestFilter, mutate } = cache;

  let mutations = [];
  for (const k of cacheKeys) {
    const key = decode(k);

    // Exit early if not a postgrest key
    if (!key) continue;

    let filter:
      | Pick<PostgrestFilter<Type>, "apply" | "hasPaths" | "applyFilters">
      | undefined;
    if (
      key.schema === schema &&
      key.table === table &&
      (filter = getPostgrestFilter(key.queryKey)).apply(input)
    ) {
      const mutatorFn =
        type === "INSERT"
          ? buildInsertMutatorFn(input)
          : type === "UPSERT"
          ? buildUpsertMutatorFn(
              input,
              op.primaryKeys as (keyof Type)[],
              filter
            )
          : type === "UPDATE"
          ? buildUpdateMutatorFn(
              input,
              op.primaryKeys as (keyof Type)[],
              filter
            )
          : type === "DELETE"
          ? buildDeleteMutatorFn(input, op.primaryKeys as (keyof Type)[])
          : undefined;
      if (mutatorFn) {
        mutations.push(mutate(k, mutatorFn));
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
