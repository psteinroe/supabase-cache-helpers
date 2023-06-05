import {
  createDirectoryUrlsFetcher,
  StoragePrivacy,
  URLFetcherConfig,
} from '@supabase-cache-helpers/storage-fetcher';
import { FileObject, StorageError } from '@supabase/storage-js';
import {
  useQuery as useReactQuery,
  UseQueryResult as UseReactQueryResult,
  UseQueryOptions as UseReactQueryOptions,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { encode, StorageFileApi } from '../lib';

/**
 * Convenience hook to fetch all files in a directory, and their corresponding URLs, from Supabase Storage using React Query.
 *
 * @param {StorageFileApi} fileApi - The file API of the storage bucket.
 * @param {string|null} path - The path of the directory to fetch files from.
 * @param {StoragePrivacy} mode - The privacy mode of the bucket to fetch files from.
 * @param {UseQueryOptions & Pick<URLFetcherConfig, 'expiresIn'>} [config] - Optional SWR configuration and `expiresIn` value to pass to the `createDirectoryUrlsFetcher` function.
 *
 * @returns {UseQueryResult<(FileObject & { url: string })[] | undefined, StorageError>} A React Query response containing an array of file objects with their corresponding URLs.
 */
function useDirectoryFileUrls(
  fileApi: StorageFileApi,
  path: string,
  mode: StoragePrivacy,
  config?: Omit<
    UseReactQueryOptions<
      (FileObject & { url: string })[] | undefined,
      StorageError
    >,
    'queryKey' | 'queryFn'
  > &
    Pick<URLFetcherConfig, 'expiresIn'>
): UseReactQueryResult<
  (FileObject & { url: string })[] | undefined,
  StorageError
> {
  const fetcher = useCallback(createDirectoryUrlsFetcher(mode, config), [
    mode,
    config,
  ]);
  return useReactQuery<
    (FileObject & { url: string })[] | undefined,
    StorageError
  >(encode([fileApi, path]), () => fetcher(fileApi, path), config);
}

export { useDirectoryFileUrls };
