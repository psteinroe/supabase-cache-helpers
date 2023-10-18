import {
  StoragePrivacy,
  createUrlFetcher,
  URLFetcherConfig,
} from '@supabase-cache-helpers/storage-core';
import { StorageError } from '@supabase/storage-js';
import {
  useQuery as useReactQuery,
  UseQueryResult as UseReactQueryResult,
  UseQueryOptions as UseReactQueryOptions,
} from '@tanstack/react-query';

import { StorageFileApi, encode } from '../lib';

/**
 * A hook to fetch the URL for a file in the Storage.
 *
 * @param fileApi - the file API instance from the Supabase client.
 * @param path - the path of the file to fetch the URL for.
 * @param mode - the privacy mode of the bucket the file is in.
 * @param config - the React Query configuration options and URL fetcher configuration.
 * @returns the React Query response for the URL of the file
 */
function useFileUrl(
  fileApi: StorageFileApi,
  path: string,
  mode: StoragePrivacy,
  config?: Omit<
    UseReactQueryOptions<string | undefined, StorageError>,
    'queryKey' | 'queryFn'
  > &
    URLFetcherConfig
): UseReactQueryResult<string | undefined, StorageError> {
  return useReactQuery<string | undefined, StorageError>({
    queryKey: encode([fileApi, path]),
    queryFn: () => createUrlFetcher(mode, config)(fileApi, path),
    ...config,
  });
}

export { useFileUrl };
