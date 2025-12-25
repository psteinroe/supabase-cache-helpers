import { KEY_PREFIX } from './constants';
import { getBucketId } from './get-bucket-id';
import { assertStorageKeyInput } from './key';
import type { QueryKey } from '@tanstack/react-query';

export const encode = (key: QueryKey): string[] => {
  const [fileApi, path] = assertStorageKeyInput(key);
  return [KEY_PREFIX, getBucketId(fileApi), path];
};
