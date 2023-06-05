import { QueryKey } from '@tanstack/react-query';

import { KEY_PREFIX } from './constants';
import { getBucketId } from './get-bucket-id';
import { assertStorageKeyInput } from './key';

export const encode = (key: QueryKey): string[] => {
  const [fileApi, path] = assertStorageKeyInput(key);
  return [KEY_PREFIX, getBucketId(fileApi), path];
};
