import { createRemoveDirectoryFetcher } from '@supabase-cache-helpers/storage-fetcher';
import { mutatePaths } from '@supabase-cache-helpers/storage-mutate';
import { FileObject, StorageError } from '@supabase/storage-js';
import { useMemo } from 'react';
import { Key, useSWRConfig } from 'swr';
import useSWRMutation, {
  SWRMutationResponse,
  SWRMutationConfiguration,
} from 'swr/mutation';

import { decode, getBucketId, StorageFileApi } from '../lib';
import { useRandomKey } from './use-random-key';

function useRemoveDirectory(
  fileApi: StorageFileApi,
  config?: SWRMutationConfiguration<FileObject[], StorageError, string, string>
): SWRMutationResponse<FileObject[], StorageError, string, string> {
  const key = useRandomKey();
  const { cache, mutate } = useSWRConfig();
  const fetcher = useMemo(
    () => createRemoveDirectoryFetcher(fileApi),
    [fileApi]
  );
  return useSWRMutation<FileObject[], StorageError, string, string>(
    key,
    async (_, { arg }) => {
      const result = fetcher(arg);
      await mutatePaths<Key>(getBucketId(fileApi), [arg], {
        cacheKeys: Array.from(cache.keys()),
        decode,
        mutate,
      });
      return result;
    },
    config
  );
}

export { useRemoveDirectory };
