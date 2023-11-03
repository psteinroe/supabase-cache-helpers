import {
  isPostgrestHasMorePaginationCacheData,
  isPostgrestPaginationCacheData,
} from './lib/cache-data-types';
import { isAnyPostgrestResponse } from './lib/response-types';
import { revalidateRelations } from './mutate/revalidate-relations';
import { revalidateTables } from './mutate/revalidate-tables';
import {
  toHasMorePaginationCacheData,
  toPaginationCacheData,
} from './mutate/transformers';
import { DecodedKey, MutatorFn, RevalidateOpts } from './mutate/types';
import { PostgrestFilter } from './postgrest-filter';
import { PostgrestQueryParserOptions } from './postgrest-query-parser';

const filterByPks = <Type extends Record<string, unknown>>(
  input: Type,
  currentData: Type[],
  primaryKeys: (keyof Type)[],
) => {
  return currentData.filter((i) =>
    primaryKeys.some((pk) => i[pk] !== input[pk]),
  );
};

export type DeleteItemOperation<Type extends Record<string, unknown>> = {
  table: string;
  schema: string;
  input: Type;
  primaryKeys: (keyof Type)[];
} & RevalidateOpts<Type>;

export type DeleteItemCache<KeyType, Type extends Record<string, unknown>> = {
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
   * The mutation function from the cache library
   */
  mutate: (key: KeyType, fn?: MutatorFn<Type>) => Promise<void> | void;
};

export const deleteItem = async <KeyType, Type extends Record<string, unknown>>(
  op: DeleteItemOperation<Type>,
  cache: DeleteItemCache<KeyType, Type>,
) => {
  const {
    input,
    revalidateRelations: revalidateRelationsOpt,
    revalidateTables: revalidateTablesOpt,
    schema,
    table,
  } = op;
  const { cacheKeys, decode, getPostgrestFilter, mutate } = cache;

  const mutations = [];
  for (const k of cacheKeys) {
    const key = decode(k);

    // Exit early if not a postgrest key
    if (!key) continue;
    if (key.schema === schema && key.table === table) {
      const filter = getPostgrestFilter(key.queryKey);
      // parse input into expected target format
      const transformedInput = filter.denormalize(input);
      if (
        // For delete, the input has to have a value for all primary keys
        op.primaryKeys.every(
          (pk) => typeof transformedInput[pk as string] !== 'undefined',
        )
      ) {
        const limit = key?.limit ?? 1000;
        mutations.push(
          mutate(k, (currentData) => {
            // Return early if undefined or null
            if (!currentData) return currentData;

            if (isPostgrestHasMorePaginationCacheData<Type>(currentData)) {
              return toHasMorePaginationCacheData(
                filterByPks<Type>(
                  input,
                  currentData.flatMap((p) => p.data),
                  op.primaryKeys,
                ),
                currentData,
                limit,
              );
            } else if (isPostgrestPaginationCacheData<Type>(currentData)) {
              return toPaginationCacheData(
                filterByPks<Type>(input, currentData.flat(), op.primaryKeys),
                limit,
              );
            } else if (isAnyPostgrestResponse<Type>(currentData)) {
              const { data } = currentData;
              if (!Array.isArray(data)) {
                return { data: null };
              }

              const newData = filterByPks(input, data, op.primaryKeys);

              return {
                data: newData,
                count: newData.length,
              };
            }
          }),
        );
      }
    }

    if (revalidateTablesOpt) {
      mutations.push(
        revalidateTables(revalidateTablesOpt, {
          key: k,
          mutate,
          decodedKey: key,
        }),
      );
    }

    if (revalidateRelationsOpt) {
      mutations.push(
        revalidateRelations(revalidateRelationsOpt, {
          input,
          key: k,
          mutate,
          decodedKey: key,
          getPostgrestFilter,
        }),
      );
    }
  }

  await Promise.all(mutations);
};
