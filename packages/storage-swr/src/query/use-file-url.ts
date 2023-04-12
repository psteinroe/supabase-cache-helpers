import {
  StoragePrivacy,
  createUrlFetcher,
  URLFetcherConfig,
} from '@supabase-cache-helpers/storage-fetcher';
import { StorageError } from '@supabase/storage-js';
import { useCallback } from 'react';
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';

import { StorageKeyInput, middleware, StorageFileApi } from '../lib';

/**
 * A hook to fetch the URL for a file in the Storage.
 *
 * @param fileApi - the file API instance from the Supabase client.
 * @param path - the path of the file to fetch the URL for.
 * @param mode - the privacy mode of the bucket the file is in.
 * @param config - the SWR configuration options and URL fetcher configuration.
 * @returns the SWR response for the URL of the file
 */
function useFileUrl(
  fileApi: StorageFileApi,
  path: string | null,
  mode: StoragePrivacy,
  config?: SWRConfiguration & URLFetcherConfig
): SWRResponse<string | undefined, StorageError> {
  const fetcher = useCallback(
    ([fileApi, path]: StorageKeyInput) =>
      createUrlFetcher(mode, config)(fileApi, path),
    [config, mode]
  );
  return useSWR(path ? [fileApi, path] : null, fetcher, {
    ...config,
    use: [...(config?.use ?? []), middleware],
  });
}

export { useFileUrl };
