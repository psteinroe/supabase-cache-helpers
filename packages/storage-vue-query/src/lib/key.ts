import { QueryKey } from '@tanstack/vue-query';

import { StorageFileApi } from './types';

export const isStorageKeyInput = (key: QueryKey): key is StorageKeyInput =>
  Array.isArray(key) &&
  key.length === 2 &&
  typeof key[1] === 'string' &&
  Boolean(key[0]['bucketId']);

export const assertStorageKeyInput = (key: QueryKey): StorageKeyInput => {
  if (!isStorageKeyInput(key)) throw new Error('Invalid key');
  return key;
};

export type StorageKeyInput = [StorageFileApi, string];
