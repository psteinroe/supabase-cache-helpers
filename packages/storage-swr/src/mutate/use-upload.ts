import {
  createUploadFetcher,
  UploadFetcherConfig,
  UploadFileResponse,
} from "@supabase-cache-helpers/storage-fetcher";
import { mutatePaths } from "@supabase-cache-helpers/storage-mutate";
import { StorageError } from "@supabase/storage-js";
import { useCallback } from "react";
import { useSWRConfig } from "swr";
import useMutation, { MutationResult, Options } from "use-mutation";
import { decode, getBucketId, StorageFileApi } from "../lib";

export type UseUploadInput = {
  files: FileList | File[];
  path?: string;
};

function useUpload(
  fileApi: StorageFileApi,
  prefix?: string,
  config?: UploadFetcherConfig &
    Options<UseUploadInput, UploadFileResponse[], StorageError>
): MutationResult<UseUploadInput, UploadFileResponse[], StorageError> {
  const { cache, mutate } = useSWRConfig();
  const fetcher = useCallback(
    ({ files, path }: UseUploadInput) =>
      createUploadFetcher(fileApi, prefix, config)(files, path),
    [config, fileApi, prefix]
  );
  return useMutation<UseUploadInput, UploadFileResponse[], StorageError>(
    fetcher,
    {
      ...config,
      async onSuccess(params): Promise<void> {
        await mutatePaths(
          getBucketId(fileApi),
          [
            [prefix, params.input.path]
              .filter(Boolean)
              .join("/")
              .replace(new RegExp("/+", "g"), "/"),
          ],
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
