import { StorageError } from '@supabase/storage-js';
import {
  StoragePrivacy,
  createUrlFetcher,
  URLFetcherConfig,
} from '@supabase-cache-helpers/storage-core';
import {
  useQuery as useVueQuery,
  UseQueryReturnType as UseVueQueryResult,
  UseQueryOptions as UseVueQueryOptions,
} from '@tanstack/vue-query';

import { StorageFileApi, encode } from '../lib';

function buildFileUrlQueryOpts(
  fileApi: StorageFileApi,
  path: string,
  mode: StoragePrivacy,
  config?: Omit<
    UseVueQueryOptions<string | undefined, StorageError>,
    'queryKey' | 'queryFn'
  > &
    URLFetcherConfig,
): UseVueQueryOptions<string | undefined, StorageError> {
  return {
    queryKey: encode([fileApi, path]),
    queryFn: () => createUrlFetcher(mode, config)(fileApi, path),
    ...config,
  };
}

/**
 * A hook to fetch the URL for a file in the Storage.
 *
 * @param fileApi - the file API instance from the Supabase client.
 * @param path - the path of the file to fetch the URL for.
 * @param mode - the privacy mode of the bucket the file is in.
 * @param config - the Vue Query configuration options and URL fetcher configuration.
 * @returns the Vue Query response for the URL of the file
 */
function useFileUrl(
  fileApi: StorageFileApi,
  path: string,
  mode: StoragePrivacy,
  config?: Omit<
    UseVueQueryOptions<string | undefined, StorageError>,
    'queryKey' | 'queryFn'
  > &
    URLFetcherConfig,
): UseVueQueryResult<string | undefined, StorageError> {
  return useVueQuery<string | undefined, StorageError>(
    buildFileUrlQueryOpts(fileApi, path, mode, config),
  );
}

export { useFileUrl };
