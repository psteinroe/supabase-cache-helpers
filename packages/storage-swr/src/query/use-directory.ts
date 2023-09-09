import { fetchDirectory } from '@supabase-cache-helpers/storage-core';
import { FileObject, StorageError } from '@supabase/storage-js';
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';

import { middleware, StorageKeyInput, StorageFileApi } from '../lib';

/**
 * Convenience hook to fetch a directory from Supabase Storage using SWR.
 *
 * @param fileApi The StorageFileApi instance.
 * @param path The path to the directory.
 * @param config The SWR configuration.
 * @returns An SWRResponse containing an array of FileObjects
 */
function useDirectory(
  fileApi: StorageFileApi,
  path: string | null,
  config?: SWRConfiguration<FileObject[] | undefined, StorageError>
): SWRResponse<FileObject[] | undefined, StorageError> {
  return useSWR<FileObject[] | undefined, StorageError>(
    path ? [fileApi, path] : null,
    ([fileApi, path]: StorageKeyInput) => fetchDirectory(fileApi, path),
    {
      ...config,
      use: [...(config?.use ?? []), middleware],
    }
  );
}

export { useDirectory };
