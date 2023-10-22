import { StorageError } from '@supabase/storage-js';
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
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { decode, getBucketId, StorageFileApi, truthy } from '../lib';

export type { UploadFetcherConfig, UploadFileResponse, FileInput };

/**
 * The input object for the useUpload mutation function.
 * @typedef {Object} UseUploadInput
 * @property {FileList|(File|FileInput)[]} files - The file(s) to be uploaded
 * @property {string} [path] - The path in the storage bucket to upload the file(s) to
 */
export type UseUploadInput = {
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
): UseMutationResult<UploadFileResponse[], StorageError, UseUploadInput> {
  const queryClient = useQueryClient();
  const fetcher = useCallback(createUploadFetcher(fileApi, config), [
    config,
    fileApi,
  ]);
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
