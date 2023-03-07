import { DecodedStorageKey, getMinimalPaths } from './lib';

export type Cache<KeyType> = {
  /**
   * The keys currently present in the cache
   */
  cacheKeys: KeyType[];
  /**
   * Decode a key. Should return null if not a Storage key.
   */
  decode: (k: KeyType) => DecodedStorageKey | null;
  /**
   * The mutation function from the cache library
   */
  mutate: (key: KeyType) => Promise<void>;
};

export const mutatePaths = async <KeyType>(
  bucketId: string,
  paths: string[],
  { cacheKeys, decode, mutate }: Cache<KeyType>
) => {
  const minimalPaths = getMinimalPaths(paths);
  if (minimalPaths.length === 0) return;
  await Promise.all(
    cacheKeys.map(async (key) => {
      const decodedKey = decode(key);
      if (!decodedKey) return false;
      if (decodedKey.bucketId !== bucketId) return false;
      if (
        minimalPaths.find(
          (p) => p.startsWith(decodedKey.path) || decodedKey.path.startsWith(p)
        )
      ) {
        mutate(key);
      }
    })
  );
};
