import { createRemoveFilesFetcher } from "@supabase-cache-helpers/storage-fetcher";
import { mutatePaths } from "@supabase-cache-helpers/storage-mutate";
import { FileObject, StorageError } from "@supabase/storage-js";
import { useCallback } from "react";
import { Key, useSWRConfig } from "swr";
import useMutation, { MutationResult, Options } from "use-mutation";
import { decode, getBucketId, StorageFileApi } from "../lib";

function useRemoveFiles(
  fileApi: StorageFileApi,
  config?: Options<string[], FileObject[], StorageError>
): MutationResult<string[], FileObject[], StorageError> {
  const { cache, mutate } = useSWRConfig();
  const fetcher = useCallback(
    (paths: string[]) => createRemoveFilesFetcher(fileApi)(paths),
    [fileApi]
  );
  return useMutation<string[], FileObject[], StorageError>(fetcher, {
    ...config,
    async onSuccess(params): Promise<void> {
      await mutatePaths<Key>(getBucketId(fileApi), params.input, {
        cacheKeys: Array.from(cache.keys()),
        decode,
        mutate,
      });
      if (config?.onSuccess) config.onSuccess(params);
    },
  });
}

export { useRemoveFiles };
