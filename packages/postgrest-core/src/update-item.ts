import {
  isPostgrestHasMorePaginationResponse,
  isAnyPostgrestResponse,
} from './lib/response-types';
import type { DecodedKey } from './mutate/types';
import type { PostgrestFilter } from './postgrest-filter';
import type { PostgrestQueryParserOptions } from './postgrest-query-parser';

/**
 * Function to merge the input with an existing item.
 * Default behavior is shallow merge: `{ ...existing, ...input }`
 */
export type MergeFn<Type> = (existing: Type, input: Type) => Type;

export type UpdateItemOperation<Type extends Record<string, unknown>> = {
  /** The schema of the table */
  schema: string;
  /** The table name */
  table: string;
  /** The input containing primary keys and fields to update */
  input: Type;
  /** The primary key column names */
  primaryKeys: (keyof Type)[];
  /**
   * Custom merge function. Receives the existing item and input, returns the merged result.
   * Default: `(existing, input) => ({ ...existing, ...input })`
   */
  merge?: MergeFn<Type>;
};

export type UpdateItemCache<KeyType, Type extends Record<string, unknown>> = {
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
  ) => Pick<PostgrestFilter<Type>, 'denormalize'>;
  /**
   * Decode a key. Should return null if not a PostgREST key.
   */
  decode: (k: KeyType) => DecodedKey | null;
  /**
   * Mutate the cache for a given key.
   * The adapter is responsible for:
   * 1. Extracting the actual data from its cache structure
   * 2. Applying updateItemInCacheData() to transform it
   * 3. Putting the result back in the cache structure
   *
   * The return value is ignored - it can be void, Promise<void>, or Promise<any>.
   */
  mutate: (key: KeyType, transformedInput: Type) => unknown;
};

/**
 * Iterates cache keys, finds matching schema/table, and calls mutate for each.
 * The actual data transformation is delegated to the adapter's mutate function.
 */
export const updateItem = async <KeyType, Type extends Record<string, unknown>>(
  op: UpdateItemOperation<Type>,
  cache: UpdateItemCache<KeyType, Type>,
): Promise<void> => {
  const { schema, table, input, primaryKeys } = op;
  const { cacheKeys, decode, getPostgrestFilter, mutate } = cache;

  const mutations: unknown[] = [];

  for (const k of cacheKeys) {
    const key = decode(k);
    if (!key) continue;
    if (key.schema !== schema || key.table !== table) continue;
    if (key.isHead === true) continue; // Skip count-only queries

    const filter = getPostgrestFilter(key.queryKey);
    const transformedInput = filter.denormalize(input);

    // Verify we have all primary key values
    const hasPrimaryKeys = primaryKeys.every(
      (pk) => typeof transformedInput[pk as string] !== 'undefined',
    );
    if (!hasPrimaryKeys) continue;

    mutations.push(mutate(k, transformedInput));
  }

  await Promise.all(mutations);
};

/**
 * Creates helper functions for updating items by primary key
 */
export const createUpdateHelpers = <Type extends Record<string, unknown>>(
  input: Type,
  primaryKeys: (keyof Type)[],
  customMerge?: MergeFn<Type>,
) => {
  const matchesPK = (item: unknown): boolean =>
    item !== null &&
    typeof item === 'object' &&
    primaryKeys.every(
      (pk) =>
        (item as Record<string, unknown>)[pk as string] === input[pk as string],
    );

  const merge = (existing: Type): Type =>
    customMerge ? customMerge(existing, input) : { ...existing, ...input };

  const updateArray = (arr: Type[]): Type[] =>
    arr.map((item) => (matchesPK(item) ? merge(item) : item));

  return { matchesPK, merge, updateArray };
};

/**
 * Base transformation for common cache formats.
 * Handles: AnyPostgrestResponse wrapper, simple arrays, HasMore pagination, single HasMore, single objects.
 */
export const updateItemInCacheData = <Type extends Record<string, unknown>>(
  data: unknown,
  input: Type,
  primaryKeys: (keyof Type)[],
  mergeFn?: MergeFn<Type>,
): unknown => {
  // Handle AnyPostgrestResponse: { error, data, count, status, statusText }
  if (isAnyPostgrestResponse<Type>(data)) {
    return {
      ...data,
      data: updateItemInCacheData(data.data, input, primaryKeys, mergeFn),
    };
  }

  const { matchesPK, merge, updateArray } = createUpdateHelpers(
    input,
    primaryKeys,
    mergeFn,
  );

  // Simple array: T[]
  if (Array.isArray(data)) {
    if (data.length === 0) return data;
    const first = data[0];

    // HasMore pagination: { data: T[], hasMore }[]
    if (isPostgrestHasMorePaginationResponse(first)) {
      return data.map((page) =>
        isPostgrestHasMorePaginationResponse<Type>(page)
          ? { ...page, data: updateArray(page.data) }
          : page,
      );
    }

    // Plain array of items (not nested arrays - those are handled by adapters)
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      return updateArray(data as Type[]);
    }

    return data;
  }

  // Single HasMore response
  if (isPostgrestHasMorePaginationResponse<Type>(data)) {
    return { ...data, data: updateArray(data.data) };
  }

  // Single object
  if (data !== null && typeof data === 'object' && matchesPK(data)) {
    return merge(data as Type);
  }

  return data;
};
