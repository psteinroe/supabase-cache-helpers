import { FileObject, StorageError } from '@supabase/storage-js';
import {
  createDirectoryUrlsFetcher,
  StoragePrivacy,
  URLFetcherConfig,
} from '@supabase-cache-helpers/storage-core';
import {
  useQuery as useVueQuery,
  UseQueryReturnType as UseVueQueryResult,
  UseQueryOptions as UseVueQueryOptions,
} from '@tanstack/vue-query';

import { encode, StorageFileApi } from '../lib';

function buildDirectoryUrlsQueryOpts(
  fileApi: StorageFileApi,
  path: string,
  mode: StoragePrivacy,
  config?: Omit<
    UseVueQueryOptions<
      (FileObject & { url: string })[] | undefined,
      StorageError
    >,
    'queryKey' | 'queryFn'
  > &
    Pick<URLFetcherConfig, 'expiresIn'>,
): UseVueQueryOptions<
  (FileObject & { url: string })[] | undefined,
  StorageError
> {
  return {
    queryKey: encode([fileApi, path]),
    queryFn: () => createDirectoryUrlsFetcher(mode, config)(fileApi, path),
    ...config,
  };
}

/**
 * Convenience hook to fetch all files in a directory, and their corresponding URLs, from Supabase Storage using Vue Query.
 *
 * @param {StorageFileApi} fileApi - The file API of the storage bucket.
 * @param {string|null} path - The path of the directory to fetch files from.
 * @param {StoragePrivacy} mode - The privacy mode of the bucket to fetch files from.
 * @param {UseQueryOptions & Pick<URLFetcherConfig, 'expiresIn'>} [config] - Optional SWR configuration and `expiresIn` value to pass to the `createDirectoryUrlsFetcher` function.
 *
 * @returns {UseQueryResult<(FileObject & { url: string })[] | undefined, StorageError>} A Vue Query response containing an array of file objects with their corresponding URLs.
 */
function useDirectoryFileUrls(
  fileApi: StorageFileApi,
  path: string,
  mode: StoragePrivacy,
  config?: Omit<
    UseVueQueryOptions<
      (FileObject & { url: string })[] | undefined,
      StorageError
    >,
    'queryKey' | 'queryFn'
  > &
    Pick<URLFetcherConfig, 'expiresIn'>,
): UseVueQueryResult<
  (FileObject & { url: string })[] | undefined,
  StorageError
> {
  return useVueQuery<
    (FileObject & { url: string })[] | undefined,
    StorageError
  >(buildDirectoryUrlsQueryOpts(fileApi, path, mode, config));
}

export { useDirectoryFileUrls, buildDirectoryUrlsQueryOpts };
