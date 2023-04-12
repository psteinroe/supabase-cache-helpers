import {
  createDirectoryUrlsFetcher,
  StoragePrivacy,
  URLFetcherConfig,
} from '@supabase-cache-helpers/storage-fetcher';
import { FileObject, StorageError } from '@supabase/storage-js';
import { useCallback } from 'react';
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';

import { StorageKeyInput, middleware, StorageFileApi } from '../lib';

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
  config?: SWRConfiguration & Pick<URLFetcherConfig, 'expiresIn'>
): SWRResponse<(FileObject & { url: string })[] | undefined, StorageError> {
  const fetcher = useCallback(
    ([fileApi, path]: StorageKeyInput) =>
      createDirectoryUrlsFetcher(mode, config)(fileApi, path),
    [mode, config]
  );
  return useSWR(path ? [fileApi, path] : null, fetcher, {
    ...config,
    use: [...(config?.use ?? []), middleware],
  });
}

export { useDirectoryFileUrls };
