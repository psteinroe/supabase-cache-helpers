import { createRemoveFilesFetcher } from '@supabase-cache-helpers/storage-fetcher';
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

function useRemoveFiles(
  fileApi: StorageFileApi,
  config?: SWRMutationConfiguration<
    FileObject[],
    StorageError,
    string[],
    string
  >
): SWRMutationResponse<FileObject[], StorageError, string[], string> {
  const key = useRandomKey();
  const { cache, mutate } = useSWRConfig();
  const fetcher = useMemo(() => createRemoveFilesFetcher(fileApi), [fileApi]);
  return useSWRMutation<FileObject[], StorageError, string, string[]>(
    key,
    async (_, { arg: paths }) => {
      const res = await fetcher(paths);
      await mutatePaths<Key>(getBucketId(fileApi), paths, {
        cacheKeys: Array.from(cache.keys()),
        decode,
        mutate,
      });
      return res;
    },
    config
  );
}

export { useRemoveFiles };
