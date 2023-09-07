import {
  createRemoveFilesFetcher,
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
 * Hook for removing files from storage using React Query mutation
 * @param {StorageFileApi} fileApi - The Supabase Storage API
 * @param {UseMutationOptions<FileObject[], StorageError, string[]>} [config] - The React Query mutation configuration
 * @returns {UseMutationOptions<FileObject[], StorageError, string[]>} - The React Query mutation response object
 */
function useRemoveFiles(
  fileApi: StorageFileApi,
  config?: Omit<
    UseMutationOptions<FileObject[], StorageError, string[]>,
    'mutationFn'
  >
): UseMutationResult<FileObject[], StorageError, string[]> {
  const queryClient = useQueryClient();
  const fetcher = useCallback(createRemoveFilesFetcher(fileApi), [fileApi]);
  return useMutation<FileObject[], StorageError, string[]>({
    mutationFn: async (paths) => {
      const res = await fetcher(paths);
      await mutatePaths<QueryKey>(getBucketId(fileApi), paths, {
        cacheKeys: queryClient
          .getQueryCache()
          .getAll()
          .map((c) => c.queryKey),
        decode,
        mutate: async (key) => {
          await queryClient.invalidateQueries({ queryKey: key });
        },
      });
      return res;
    },
    ...config,
  });
}

export { useRemoveFiles };
