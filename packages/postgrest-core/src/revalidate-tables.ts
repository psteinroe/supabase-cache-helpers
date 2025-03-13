import {
  RevalidateTables,
  shouldRevalidateTable,
} from './mutate/should-revalidate-table';
import type { DecodedKey } from './mutate/types';

export type RevalidateTablesOperation = RevalidateTables;

export type RevalidateTablesCache<KeyType> = {
  /**
   * The keys currently present in the cache
   */
  cacheKeys: KeyType[];
  /**
   * Decode a key. Should return null if not a PostgREST key.
   */
  decode: (k: KeyType) => DecodedKey | null;
  /**
   * The revalidation function from the cache library
   */
  revalidate: (key: KeyType) => Promise<void> | void;
};

export const revalidateTables = async <KeyType>(
  tables: RevalidateTablesOperation,
  cache: RevalidateTablesCache<KeyType>,
) => {
  const { cacheKeys, decode, revalidate } = cache;

  const mutations = [];
  for (const k of cacheKeys) {
    const key = decode(k);

    // Exit early if not a postgrest key
    if (!key) continue;

    if (shouldRevalidateTable(tables, { decodedKey: key })) {
      mutations.push(revalidate(k));
    }
  }

  await Promise.all(mutations);
};
