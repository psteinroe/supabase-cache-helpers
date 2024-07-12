import {
  type StoragePrivacy,
  type URLFetcherConfig,
  createDirectoryUrlsFetcher,
} from "@supabase-cache-helpers/storage-core";
import type { FileObject, StorageError } from "@supabase/storage-js";
import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";

import { type StorageFileApi, type StorageKeyInput, middleware } from "../lib";

/**
 * Convenience hook to fetch all files in a directory, and their corresponding URLs, from Supabase Storage using SWR.
 *
 * @param {StorageFileApi} fileApi - The file API of the storage bucket.
 * @param {string|null} path - The path of the directory to fetch files from.
 * @param {StoragePrivacy} mode - The privacy mode of the bucket to fetch files from.
 * @param {SWRConfiguration & Pick<URLFetcherConfig, 'expiresIn'>} [config] - Optional SWR configuration and `expiresIn` value to pass to the `createDirectoryUrlsFetcher` function.
 *
 * @returns {SWRResponse<(FileObject & { url: string })[] | undefined, StorageError>} An SWR response containing an array of file objects with their corresponding URLs.
 */
function useDirectoryFileUrls(
  fileApi: StorageFileApi,
  path: string | null,
  mode: StoragePrivacy,
  config?: SWRConfiguration<
    (FileObject & { url: string })[] | undefined,
    StorageError
  > &
    Pick<URLFetcherConfig, "expiresIn">,
): SWRResponse<(FileObject & { url: string })[] | undefined, StorageError> {
  return useSWR<(FileObject & { url: string })[] | undefined, StorageError>(
    path ? [fileApi, path] : null,
    ([fileApi, path]: StorageKeyInput) =>
      createDirectoryUrlsFetcher(mode, config)(fileApi, path),
    {
      ...config,
      use: [...(config?.use ?? []), middleware],
    },
  );
}

export { useDirectoryFileUrls };
