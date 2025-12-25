import { type StorageFileApi, decode, getBucketId } from '../lib';
import { useRandomKey } from './use-random-key';
import {
  createRemoveDirectoryFetcher,
  mutatePaths,
} from '@supabase-cache-helpers/storage-core';
import type { FileObject, StorageError } from '@supabase/storage-js';
import { useCallback } from 'react';
import { type Key, useSWRConfig } from 'swr';
import useSWRMutation, {
  type SWRMutationResponse,
  type SWRMutationConfiguration,
} from 'swr/mutation';

/**
 * A hook that provides a mutation function to remove a directory and all its contents.
 * @param fileApi The `StorageFileApi` instance to use for the removal.
 * @param config Optional configuration options for the SWR mutation.
 * @returns An object containing the mutation function, loading state, and error state.
 */
function useRemoveDirectory(
  fileApi: StorageFileApi,
  config?: SWRMutationConfiguration<FileObject[], StorageError, string, string>,
): SWRMutationResponse<FileObject[], StorageError, string, string> {
  const key = useRandomKey();
  const { cache, mutate } = useSWRConfig();
  const fetcher = useCallback(createRemoveDirectoryFetcher(fileApi), [fileApi]);
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
    config,
  );
}

export { useRemoveDirectory };
