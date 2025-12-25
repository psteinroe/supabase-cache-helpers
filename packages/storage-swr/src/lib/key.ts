import type { StorageFileApi } from './types';
import type { Key } from 'swr';

export const isStorageKeyInput = (key: Key): key is StorageKeyInput =>
  Array.isArray(key) &&
  key.length === 2 &&
  typeof key[1] === 'string' &&
  Boolean(key[0]['bucketId']);

export const assertStorageKeyInput = (key: Key): StorageKeyInput => {
  if (!isStorageKeyInput(key)) throw new Error('Invalid key');
  return key;
};

export type StorageKeyInput = [StorageFileApi, string];
