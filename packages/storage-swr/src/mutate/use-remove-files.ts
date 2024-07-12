import {
  createRemoveFilesFetcher,
  mutatePaths,
} from "@supabase-cache-helpers/storage-core";
import type { FileObject, StorageError } from "@supabase/storage-js";
import { useCallback } from "react";
import { type Key, useSWRConfig } from "swr";
import useSWRMutation, {
  type SWRMutationResponse,
  type SWRMutationConfiguration,
} from "swr/mutation";

import { type StorageFileApi, decode, getBucketId } from "../lib";
import { useRandomKey } from "./use-random-key";

/**
 * Hook for removing files from storage using SWR mutation
 * @param {StorageFileApi} fileApi - The Supabase Storage API
 * @param {SWRMutationConfiguration<FileObject[], StorageError, string[], string>} [config] - The SWR mutation configuration
 * @returns {SWRMutationResponse<FileObject[], StorageError, string[], string>} - The SWR mutation response object
 */
function useRemoveFiles(
  fileApi: StorageFileApi,
  config?: SWRMutationConfiguration<
    FileObject[],
    StorageError,
    string,
    string[]
  >,
): SWRMutationResponse<FileObject[], StorageError, string, string[]> {
  const key = useRandomKey();
  const { cache, mutate } = useSWRConfig();
  const fetcher = useCallback(createRemoveFilesFetcher(fileApi), [fileApi]);
  return useSWRMutation<FileObject[], StorageError, string, string[]>(
    key,
    async (_, { arg: paths }) => {
      const res = await fetcher(paths);
      await mutatePaths<Key>(getBucketId(fileApi), paths, {
        cacheKeys: Array.from(cache.keys()),
        decode,
        mutate,
      });
      return res;
    },
    config,
  );
}

export { useRemoveFiles };
