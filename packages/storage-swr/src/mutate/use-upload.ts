import {
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

export type UseUploadInput = {
  files: FileList | File[];
  path?: string;
};

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
