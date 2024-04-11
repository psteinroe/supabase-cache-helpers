import { FileObject, StorageError } from '@supabase/storage-js';
import {
  FileInput,
  createUploadFetcher,
  UploadFetcherConfig,
  UploadFileResponse,
  mutatePaths,
} from '@supabase-cache-helpers/storage-core';
import {
  useMutation,
  UseMutationOptions,
  UseMutationReturnType,
  useQueryClient,
} from '@tanstack/vue-query';

import { decode, getBucketId, StorageFileApi, truthy } from '../lib';

export type { UploadFetcherConfig, UploadFileResponse, FileInput };

export type UseUploadInput = {
  file: FileObject;
  files: FileList | (File | FileInput)[];
  path?: string;
};

/**
 * Hook for uploading files to storage using React Query mutation
 * @param {StorageFileApi} fileApi - The Supabase Storage API
 * @param {UploadFetcherConfig & UseMutationOptions<UploadFileResponse[], StorageError, UseUploadInput>} [config] - The React Query mutation configuration
 * @returns {UseMutationResult<UploadFileResponse[], StorageError, UseUploadInput>} - The React Query mutation response object
 */
function useUpload(
  fileApi: StorageFileApi,
  config?: UploadFetcherConfig &
    Omit<
      UseMutationOptions<UploadFileResponse[], StorageError, UseUploadInput>,
      'mutationFn'
    >,
): UseMutationReturnType<
  UploadFileResponse[],
  StorageError,
  UseUploadInput,
  unknown
> {
  const queryClient = useQueryClient();
  const fetcher = createUploadFetcher(fileApi, config);
  return useMutation({
    mutationFn: async ({ files, path }) => {
      const result = await fetcher(files, path);
      await mutatePaths(
        getBucketId(fileApi),
        result.map(({ data }) => data?.path).filter(truthy),
        {
          cacheKeys: queryClient
            .getQueryCache()
            .getAll()
            .map((c) => c.queryKey),
          decode,
          mutate: async (key) => {
            await queryClient.invalidateQueries({ queryKey: key });
          },
        },
      );
      return result;
    },
    ...config,
  });
}

export { useUpload };
