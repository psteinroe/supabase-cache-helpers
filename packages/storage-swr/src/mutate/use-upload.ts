import {
  createUploadFetcher,
  UploadFetcherConfig,
  UploadFileResponse,
} from '@supabase-cache-helpers/storage-fetcher';
import { mutatePaths } from '@supabase-cache-helpers/storage-mutate';
import { StorageError } from '@supabase/storage-js';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import useMutation, { MutationResult, Options } from 'use-mutation';

import { decode, getBucketId, StorageFileApi, truthy } from '../lib';

export type { UploadFetcherConfig, UploadFileResponse };

export type UseUploadInput = {
  files: FileList | File[];
  path?: string;
};

function useUpload(
  fileApi: StorageFileApi,
  config?: UploadFetcherConfig &
    Options<UseUploadInput, UploadFileResponse[], StorageError>
): MutationResult<UseUploadInput, UploadFileResponse[], StorageError> {
  const { cache, mutate } = useSWRConfig();
  const fetcher = useCallback(
    ({ files, path }: UseUploadInput) =>
      createUploadFetcher(fileApi, config)(files, path),
    [config, fileApi]
  );
  return useMutation<UseUploadInput, UploadFileResponse[], StorageError>(
    fetcher,
    {
      ...config,
      async onSuccess(params): Promise<void> {
        await mutatePaths(
          getBucketId(fileApi),
          params.data.map(({ data }) => data?.path).filter(truthy),
          {
            cacheKeys: Array.from(cache.keys()),
            decode,
            mutate,
          }
        );
        if (config?.onSuccess) config.onSuccess(params);
      },
    }
  );
}

export { useUpload };
