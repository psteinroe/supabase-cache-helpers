import { FileObject, StorageError } from '@supabase/storage-js';
import { fetchDirectory } from '@supabase-cache-helpers/storage-core';
import {
  useQuery as useVueQuery,
  UseQueryReturnType as UseVueQueryResult,
  UseQueryOptions as UseVueQueryOptions,
} from '@tanstack/vue-query';

import { StorageFileApi, encode } from '../lib';

function buildDirectoryQueryOpts(
  fileApi: StorageFileApi,
  path: string,
  config?: Omit<
    UseVueQueryOptions<FileObject[] | undefined, StorageError>,
    'queryKey' | 'queryFn'
  >,
): UseVueQueryOptions<FileObject[] | undefined, StorageError> {
  return {
    queryKey: encode([fileApi, path]),
    queryFn: () => fetchDirectory(fileApi, path),
    ...config,
  };
}

/**
 * Convenience hook to fetch a directory from Supabase Storage using Vue Query.
 *
 * @param fileApi The StorageFileApi instance.
 * @param path The path to the directory.
 * @param config The Vue Query configuration.
 * @returns An UseQueryResult containing an array of FileObjects
 */
function useDirectory(
  fileApi: StorageFileApi,
  path: string,
  config?: Omit<
    UseVueQueryOptions<FileObject[] | undefined, StorageError>,
    'queryKey' | 'queryFn'
  >,
): UseVueQueryResult<FileObject[] | undefined, StorageError> {
  return useVueQuery(buildDirectoryQueryOpts(fileApi, path, config));
}

export { useDirectory };
