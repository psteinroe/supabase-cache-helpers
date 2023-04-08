import {
  ArrayBufferFile,
  createUploadFetcher,
  UploadFetcherConfig,
  UploadFileResponse,
} from '@supabase-cache-helpers/storage-fetcher';
import { mutatePaths } from '@supabase-cache-helpers/storage-mutate';
import { StorageError } from '@supabase/storage-js';
import { useMemo } from 'react';
import { useSWRConfig } from 'swr';
import useSWRMutation, {
  SWRMutationResponse,
  SWRMutationConfiguration,
} from 'swr/mutation';

import { decode, getBucketId, StorageFileApi, truthy } from '../lib';
import { useRandomKey } from './use-random-key';

export type { UploadFetcherConfig, UploadFileResponse };

/**
 * The input object for the useUpload mutation function.
 * @typedef {Object} UseUploadInput
 * @property {FileList|File[]|ArrayBufferFile[]} files - The file(s) to be uploaded
 * @property {string} [path] - The path in the storage bucket to upload the file(s) to
 */
export type UseUploadInput = {
  files: FileList | File[] | ArrayBufferFile[];
  path?: string;
};

/**
 * Hook for uploading files to storage using SWR mutation
 * @param {StorageFileApi} fileApi - The Supabase Storage API
 * @param {UploadFetcherConfig & SWRMutationConfiguration<UploadFileResponse[], StorageError, UseUploadInput, string>} [config] - The SWR mutation configuration
 * @returns {SWRMutationResponse<UploadFileResponse[], StorageError, UseUploadInput, string>} - The SWR mutation response object
 */
function useUpload(
  fileApi: StorageFileApi,
  config?: UploadFetcherConfig &
    SWRMutationConfiguration<
      UploadFileResponse[],
      StorageError,
      UseUploadInput,
      string
    >
): SWRMutationResponse<
  UploadFileResponse[],
  StorageError,
  UseUploadInput,
  string
> {
  const key = useRandomKey();
  const { cache, mutate } = useSWRConfig();
  const fetcher = useMemo(
    () => createUploadFetcher(fileApi, config),
    [config, fileApi]
  );
  return useSWRMutation<
    UploadFileResponse[],
    StorageError,
    string,
    UseUploadInput
  >(
    key,
    async (_, { arg: { files, path } }) => {
      const result = await fetcher(files, path);
      await mutatePaths(
        getBucketId(fileApi),
        result.map(({ data }) => data?.path).filter(truthy),
        {
          cacheKeys: Array.from(cache.keys()),
          decode,
          mutate,
        }
      );
      return result;
    },
    config
  );
}

export { useUpload };
