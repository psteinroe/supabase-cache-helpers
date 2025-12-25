import { KEY_PREFIX } from './constants';
import type { DecodedStorageKey } from '@supabase-cache-helpers/storage-core';
import type { QueryKey } from '@tanstack/react-query';

export const decode = (key: QueryKey): DecodedStorageKey | null => {
  if (!Array.isArray(key) || key.length !== 3 || key[0] !== KEY_PREFIX) {
    return null;
  }
  const [_, bucketId, path] = key;
  return { bucketId, path };
};
