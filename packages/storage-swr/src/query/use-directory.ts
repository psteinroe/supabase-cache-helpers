import { fetchDirectory } from '@supabase-cache-helpers/storage-fetcher';
import { FileObject, StorageError } from '@supabase/storage-js';
import { useCallback } from 'react';
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
  config?: SWRConfiguration
): SWRResponse<FileObject[] | undefined, StorageError> {
  const fetcher = useCallback(
    ([fileApi, path]: StorageKeyInput) => fetchDirectory(fileApi, path),
    []
  );
  return useSWR<FileObject[] | undefined, StorageError>(
    path ? [fileApi, path] : null,
    fetcher,
    {
      ...config,
      use: [...(config?.use ?? []), middleware],
    }
  );
}

export { useDirectory };
