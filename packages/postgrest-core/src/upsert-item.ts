import { shouldRevalidateRelation } from './mutate/should-revalidate-relation';
import { shouldRevalidateTable } from './mutate/should-revalidate-table';
import type { DecodedKey, RevalidateOpts } from './mutate/types';
import type { PostgrestFilter } from './postgrest-filter';
import type { PostgrestQueryParserOptions } from './postgrest-query-parser';

export type UpsertItemOperation<Type extends Record<string, unknown>> = {
  table: string;
  schema: string;
  input: Type;
  primaryKeys: (keyof Type)[];
} & RevalidateOpts<Type>;

export type UpsertItemCache<KeyType, Type extends Record<string, unknown>> = {
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
    opts?: PostgrestQueryParserOptions,
  ) => Pick<
    PostgrestFilter<Type>,
    | 'applyFilters'
    | 'denormalize'
    | 'hasFiltersOnPaths'
    | 'applyFiltersOnPaths'
    | 'apply'
    | 'hasWildcardPath'
    | 'hasAggregatePath'
  >;
  /**
   * Decode a key. Should return null if not a PostgREST key.
   */
  decode: (k: KeyType) => DecodedKey | null;
  /**
   * The revalidation function from the cache library
   */
  revalidate: (key: KeyType) => Promise<void> | void;
  /**
   * Get the cached data for a given key
   *
   * We always expect an array of `Type` here for simplicity, and the caller must be responsible for converting it.
   */
  getData(key: KeyType): Type[] | undefined;
};
export const upsertItem = async <KeyType, Type extends Record<string, unknown>>(
  op: UpsertItemOperation<Type>,
  cache: UpsertItemCache<KeyType, Type>,
) => {
  const {
    revalidateRelations: revalidateRelationsOpt,
    revalidateTables: revalidateTablesOpt,
    schema,
    table,
  } = op;
  const { cacheKeys, decode, getPostgrestFilter, getData, revalidate } = cache;

  const revalidations = [];

  for (const k of cacheKeys) {
    const key = decode(k);

    // Exit early if not a postgrest key
    if (!key) continue;
    const filter = getPostgrestFilter(key.queryKey);
    if (key.schema === schema && key.table === table) {
      // parse input into expected target format
      const transformedInput = filter.denormalize(op.input);
      if (
        filter.applyFilters(transformedInput) ||
        // also allow upsert if either the filter does not apply eq filters on any pk
        !filter.hasFiltersOnPaths(op.primaryKeys as string[]) ||
        // or input matches all pk filters
        filter.applyFiltersOnPaths(transformedInput, op.primaryKeys as string[])
      ) {
        revalidations.push(revalidate(k));
      }
    }

    if (
      revalidateTablesOpt &&
      shouldRevalidateTable(revalidateTablesOpt, { decodedKey: key })
    ) {
      revalidations.push(revalidate(k));
    }

    if (
      revalidateRelationsOpt &&
      shouldRevalidateRelation(revalidateRelationsOpt, {
        input: op.input,
        getPostgrestFilter,
        decodedKey: key,
      })
    ) {
      revalidations.push(revalidate(k));
    }
  }
  await Promise.all(revalidations);
};
