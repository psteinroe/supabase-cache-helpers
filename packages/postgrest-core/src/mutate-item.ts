import {
  isPostgrestHasMorePaginationCacheData,
  isPostgrestPaginationCacheData,
} from './lib/cache-data-types';
import { findIndexOrdered } from './lib/find-index-ordered';
import { parseOrderByKey } from './lib/parse-order-by-key';
import { OrderDefinition } from './lib/query-types';
import { isAnyPostgrestResponse } from './lib/response-types';
import { shouldRevalidateRelation } from './mutate/should-revalidate-relation';
import { shouldRevalidateTable } from './mutate/should-revalidate-table';
import {
  toHasMorePaginationCacheData,
  toPaginationCacheData,
} from './mutate/transformers';
import { DecodedKey, MutatorFn, RevalidateOpts } from './mutate/types';
import { PostgrestFilter } from './postgrest-filter';
import { PostgrestQueryParserOptions } from './postgrest-query-parser';

export const mutateOperation = <Type extends Record<string, unknown>>(
  input: Partial<Type>,
  mutate: (current: Type) => Type,
  currentData: Type[],
  primaryKeys: (keyof Type)[],
  filter: Pick<PostgrestFilter<Type>, 'apply'>,
  orderBy?: OrderDefinition[],
) => {
  // find item
  const itemIdx = currentData.findIndex((oldItem) =>
    primaryKeys.every((pk) => oldItem[pk] === input[pk]),
  );

  if (itemIdx === -1) {
    // if not exists, do nothing
    return currentData;
  }

  let newItemIdx = itemIdx;
  const newItem = mutate(currentData[newItemIdx]);

  // if exists, remove
  currentData.splice(itemIdx, 1);

  if (orderBy && Array.isArray(orderBy) && orderBy.length > 0) {
    // if ordered, find new idx
    newItemIdx = findIndexOrdered(newItem, currentData, orderBy);
  }

  if (newItemIdx === -1) {
    // default to prepend
    newItemIdx = 0;
  }

  // check that new item is still a valid member of the list and has all required paths
  if (filter.apply(newItem)) {
    currentData.splice(newItemIdx, 0, newItem);
  }

  return currentData;
};

export type MutateItemOperation<Type extends Record<string, unknown>> = {
  table: string;
  schema: string;
  input: Partial<Type>;
  mutate: (current: Type) => Type;
  primaryKeys: (keyof Type)[];
} & RevalidateOpts<Type>;

export type MutateItemCache<KeyType, Type extends Record<string, unknown>> = {
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
  >;
  /**
   * Decode a key. Should return null if not a PostgREST key.
   */
  decode: (k: KeyType) => DecodedKey | null;
  /**
   * The mutation function from the cache library
   */
  mutate: (key: KeyType, fn?: MutatorFn<Type>) => Promise<void> | void;
};

export const mutateItem = async <KeyType, Type extends Record<string, unknown>>(
  op: MutateItemOperation<Type>,
  cache: MutateItemCache<KeyType, Type>,
) => {
  const {
    mutate: mutateInput,
    revalidateRelations: revalidateRelationsOpt,
    revalidateTables: revalidateTablesOpt,
    schema,
    table,
    primaryKeys,
  } = op;
  const { cacheKeys, decode, getPostgrestFilter, mutate } = cache;

  const mutations = [];
  for (const k of cacheKeys) {
    const key = decode(k);

    // Exit early if not a postgrest key
    if (!key) continue;
    const filter = getPostgrestFilter(key.queryKey);
    // parse input into expected target format
    const transformedInput = filter.denormalize(op.input);
    if (key.schema === schema && key.table === table) {
      if (
        // For mutate, the input has to have a value for all primary keys
        op.primaryKeys.every(
          (pk) => typeof transformedInput[pk as string] !== 'undefined',
        ) && // allow mutate if either the filter does not apply eq filters on any pk
        (!filter.hasFiltersOnPaths(op.primaryKeys as string[]) ||
          // or input matches all pk filters
          filter.applyFiltersOnPaths(
            transformedInput,
            op.primaryKeys as string[],
          ))
      ) {
        const limit = key.limit ?? 1000;
        const orderBy = key.orderByKey
          ? parseOrderByKey(key.orderByKey)
          : undefined;
        mutations.push(
          mutate(k, (currentData) => {
            // Return early if undefined or null
            if (!currentData) return currentData;

            if (isPostgrestHasMorePaginationCacheData<Type>(currentData)) {
              return toHasMorePaginationCacheData(
                mutateOperation<Type>(
                  transformedInput,
                  mutateInput,
                  currentData.flatMap((p) => p.data),
                  primaryKeys,
                  filter,
                  orderBy,
                ),
                currentData,
                limit,
              );
            } else if (isPostgrestPaginationCacheData<Type>(currentData)) {
              return toPaginationCacheData(
                mutateOperation<Type>(
                  transformedInput,
                  mutateInput,
                  currentData.flat(),
                  primaryKeys,
                  filter,
                  orderBy,
                ),
                limit,
              );
            } else if (isAnyPostgrestResponse<Type>(currentData)) {
              const { data } = currentData;

              if (!Array.isArray(data)) {
                if (data === null) {
                  return {
                    data,
                    count: currentData.count,
                  };
                }
                const newData = mutateInput(data);
                return {
                  // Check if the new data is still valid given the key
                  data: filter.apply(newData) ? newData : null,
                  count: currentData.count,
                };
              }

              const newData = mutateOperation<Type>(
                transformedInput,
                mutateInput,
                // deep copy data to avoid mutating the original
                JSON.parse(JSON.stringify(data)),
                primaryKeys,
                filter,
                orderBy,
              );

              return {
                data: newData,
                count: newData.length,
              };
            }
            return currentData;
          }),
        );
      }
    }

    if (
      revalidateTablesOpt &&
      shouldRevalidateTable(revalidateTablesOpt, { decodedKey: key })
    ) {
      mutations.push(mutate(k));
    }

    if (
      revalidateRelationsOpt &&
      shouldRevalidateRelation(revalidateRelationsOpt, {
        input: transformedInput,
        getPostgrestFilter,
        decodedKey: key,
      })
    ) {
      mutations.push(mutate(k));
    }
  }
  await Promise.all(mutations);
};
