import { shouldRevalidateRelation } from './mutate/should-revalidate-relation';
import { shouldRevalidateTable } from './mutate/should-revalidate-table';
import type { DecodedKey, RevalidateOpts } from './mutate/types';
import type { PostgrestFilter } from './postgrest-filter';
import type { PostgrestQueryParserOptions } from './postgrest-query-parser';

export type RevalidateForUpsertOperation<Type extends Record<string, unknown>> =
  {
    table: string;
    schema: string;
    input: Type;
    primaryKeys: (keyof Type)[];
  } & RevalidateOpts<Type>;

export type RevalidateForUpsertCache<
  KeyType,
  Type extends Record<string, unknown>,
> = {
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
  ) => Pick<PostgrestFilter<Type>, 'applyFilters' | 'denormalize'>;
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
export const revalidateForUpsert = async <
  KeyType,
  Type extends Record<string, unknown>,
>(
  op: RevalidateForUpsertOperation<Type>,
  cache: RevalidateForUpsertCache<KeyType, Type>,
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
      if (key.isHead === true) {
        // Always revalidate head (count-only) queries since upsert may affect count
        revalidations.push(revalidate(k));
      } else {
        // parse input into expected target format
        const transformedInput = filter.denormalize(op.input);

        // Check if item currently exists in cache (by primary key)
        const data = getData(k);
        const itemExistsInCache = data?.some((item) =>
          op.primaryKeys.every(
            (pk) => item[pk as string] === transformedInput[pk as string],
          ),
        );

        if (
          filter.applyFilters(transformedInput) || // Item SHOULD be in query
          itemExistsInCache // Item WAS in query (may need removal after update)
        ) {
          revalidations.push(revalidate(k));
        }
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
