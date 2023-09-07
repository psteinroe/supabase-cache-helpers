import {
  createRemoveDirectoryFetcher,
  mutatePaths,
} from '@supabase-cache-helpers/storage-core';
import { FileObject, StorageError } from '@supabase/storage-js';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { decode, getBucketId, StorageFileApi } from '../lib';

/**
 * A hook that provides a mutation function to remove a directory and all its contents.
 * @param fileApi The `StorageFileApi` instance to use for the removal.
 * @param config Optional configuration options for the React Query mutation.
 * @returns An object containing the mutation function, loading state, and error state.
 */
function useRemoveDirectory(
  fileApi: StorageFileApi,
  config?: Omit<
    UseMutationOptions<FileObject[], StorageError, string>,
    'mutationFn'
  >
): UseMutationResult<FileObject[], StorageError, string> {
  const queryClient = useQueryClient();
  const fetcher = useCallback(createRemoveDirectoryFetcher(fileApi), [fileApi]);
  return useMutation<FileObject[], StorageError, string>({
    mutationFn: async (arg) => {
      const result = fetcher(arg);
      await mutatePaths<QueryKey>(getBucketId(fileApi), [arg], {
        cacheKeys: queryClient
          .getQueryCache()
          .getAll()
          .map((c) => c.queryKey),
        decode,
        mutate: async (key) => {
          await queryClient.invalidateQueries({ queryKey: key });
        },
      });
      return result;
    },
    ...config,
  });
}

export { useRemoveDirectory };
