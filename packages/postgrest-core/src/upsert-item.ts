import { merge as mergeAnything } from 'merge-anything';

import {
  isPostgrestHasMorePaginationCacheData,
  isPostgrestPaginationCacheData,
} from './lib/cache-data-types';
import { findIndexOrdered } from './lib/find-index-ordered';
import { parseOrderByKey } from './lib/parse-order-by-key';
import type { OrderDefinition } from './lib/query-types';
import { isAnyPostgrestResponse } from './lib/response-types';
import { shouldRevalidateRelation } from './mutate/should-revalidate-relation';
import { shouldRevalidateTable } from './mutate/should-revalidate-table';
import {
  toHasMorePaginationCacheData,
  toPaginationCacheData,
} from './mutate/transformers';
import type { DecodedKey, MutatorFn, RevalidateOpts } from './mutate/types';
import type { PostgrestFilter } from './postgrest-filter';
import type { PostgrestQueryParserOptions } from './postgrest-query-parser';

type MergeFn<Type extends Record<string, unknown>> = (
  current: Type,
  input: Type,
) => Type;

export const upsert = <Type extends Record<string, unknown>>(
  input: Type,
  currentData: Type[],
  primaryKeys: (keyof Type)[],
  filter: Pick<PostgrestFilter<Type>, 'apply'>,
  mergeFn?: MergeFn<Type>,
  orderBy?: OrderDefinition[],
) => {
  const merge = mergeFn ?? (mergeAnything as MergeFn<Type>);

  // find item
  const itemIdx = currentData.findIndex((oldItem) =>
    primaryKeys.every((pk) => oldItem[pk] === input[pk]),
  );

  let newItem = input;
  let newItemIdx = itemIdx;

  if (itemIdx !== -1) {
    // if exists, merge and remove
    newItem = merge(currentData[itemIdx], input) as Type;
    currentData.splice(itemIdx, 1);
  }

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

export type UpsertItemOperation<Type extends Record<string, unknown>> = {
  table: string;
  schema: string;
  input: Type;
  primaryKeys: (keyof Type)[];
  merge?: (current: Type, input: Type) => Type;
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
  >;
  /**
   * Decode a key. Should return null if not a PostgREST key.
   */
  decode: (k: KeyType) => DecodedKey | null;
  /**
   * The mutation function from the cache library
   */
  mutate: (key: KeyType, fn: MutatorFn<Type>) => Promise<void> | void;
  /**
   * The revalidation function from the cache library
   */
  revalidate: (key: KeyType) => Promise<void> | void;
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
    primaryKeys,
  } = op;
  const { cacheKeys, decode, getPostgrestFilter, mutate, revalidate } = cache;

  const mutations = [];
  for (const k of cacheKeys) {
    const key = decode(k);

    // Exit early if not a postgrest key
    if (!key) continue;
    const filter = getPostgrestFilter(key.queryKey);
    // parse input into expected target format
    if (key.schema === schema && key.table === table) {
      const transformedInput = filter.denormalize(op.input);
      if (
        filter.applyFilters(transformedInput) ||
        // also allow upsert if either the filter does not apply eq filters on any pk
        !filter.hasFiltersOnPaths(op.primaryKeys as string[]) ||
        // or input matches all pk filters
        filter.applyFiltersOnPaths(transformedInput, op.primaryKeys as string[])
      ) {
        const merge = op.merge ?? (mergeAnything as MergeFn<Type>);
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
                upsert<Type>(
                  transformedInput,
                  currentData.flatMap((p) => p.data),
                  primaryKeys,
                  filter,
                  merge,
                  orderBy,
                ),
                currentData,
                limit,
              );
            } else if (isPostgrestPaginationCacheData<Type>(currentData)) {
              return toPaginationCacheData(
                upsert<Type>(
                  transformedInput,
                  currentData.flat(),
                  primaryKeys,
                  filter,
                  merge,
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
                const newData = merge(data, transformedInput);
                return {
                  // Check if the new data is still valid given the key
                  data: filter.apply(newData) ? newData : null,
                  count: currentData.count,
                };
              }

              const newData = upsert<Type>(
                transformedInput,
                // deep copy data to avoid mutating the original
                JSON.parse(JSON.stringify(data)),
                primaryKeys,
                filter,
                merge,
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
      mutations.push(revalidate(k));
    }

    if (
      revalidateRelationsOpt &&
      shouldRevalidateRelation(revalidateRelationsOpt, {
        input: op.input,
        getPostgrestFilter,
        decodedKey: key,
      })
    ) {
      mutations.push(revalidate(k));
    }
  }
  await Promise.all(mutations);
};
