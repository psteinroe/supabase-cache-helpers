import { shouldRevalidateRelation } from './mutate/should-revalidate-relation';
import { shouldRevalidateTable } from './mutate/should-revalidate-table';
import type { DecodedKey, RevalidateOpts } from './mutate/types';
import type { PostgrestFilter } from './postgrest-filter';
import type { PostgrestQueryParserOptions } from './postgrest-query-parser';

export type RevalidateForDeleteOperation<Type extends Record<string, unknown>> =
  {
    table: string;
    schema: string;
    input: Type;
    primaryKeys: (keyof Type)[];
  } & RevalidateOpts<Type>;

export type RevalidateForDeleteCache<
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

export const revalidateForDelete = async <
  KeyType,
  Type extends Record<string, unknown>,
>(
  op: RevalidateForDeleteOperation<Type>,
  cache: RevalidateForDeleteCache<KeyType, Type>,
) => {
  const {
    revalidateRelations: revalidateRelationsOpt,
    revalidateTables: revalidateTablesOpt,
    schema,
    table,
  } = op;
  const { cacheKeys, decode, getPostgrestFilter, revalidate } = cache;

  const revalidations = [];

  for (const k of cacheKeys) {
    const key = decode(k);

    // Exit early if not a postgrest key
    if (!key) continue;
    const filter = getPostgrestFilter(key.queryKey);
    // parse input into expected target format
    if (key.schema === schema && key.table === table) {
      if (key.isHead === true) {
        revalidations.push(revalidate(k));
      } else {
        const transformedInput = filter.denormalize(op.input);
        if (
          // For delete, the input has to have a value for all primary keys
          op.primaryKeys.every(
            (pk) => typeof transformedInput[pk as string] !== 'undefined',
          )
        ) {
          // check if the cached data contains the item to be deleted
          const data = cache.getData(k);
          if (
            data &&
            data.some((item) =>
              op.primaryKeys.every(
                (pk) => item[pk as string] === transformedInput[pk as string],
              ),
            )
          ) {
            revalidations.push(revalidate(k));
          }
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
