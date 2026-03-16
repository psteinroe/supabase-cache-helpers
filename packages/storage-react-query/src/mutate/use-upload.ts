import { type StorageFileApi, decode, getBucketId, truthy } from '../lib';
import {
  type FileInput,
  type UploadFetcherConfig,
  type UploadFileResponse,
  createUploadFetcher,
  mutatePaths,
} from '@supabase-cache-helpers/storage-core';
import type { StorageError } from '@supabase/storage-js';
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

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
  const fetcher = useCallback(
    (files: FileList | (File | FileInput)[], path?: string) =>
      createUploadFetcher(fileApi, config)(files, path),
    [config, fileApi],
  );
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
