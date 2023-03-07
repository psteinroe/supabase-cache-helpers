import { fetchDirectory } from '@supabase-cache-helpers/storage-fetcher';
import { FileObject, StorageError } from '@supabase/storage-js';
import { useCallback } from 'react';
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';

import { middleware, StorageKeyInput, StorageFileApi } from '../lib';

function useDirectory(
  fileApi: StorageFileApi,
  path: string | null,
  config?: SWRConfiguration
): SWRResponse<FileObject[] | undefined, StorageError> {
  const fetcher = useCallback(
    ([fileApi, path]: StorageKeyInput) => fetchDirectory(fileApi, path),
    []
  );
  return useSWR(path ? [fileApi, path] : null, fetcher, {
    ...config,
    use: [...(config?.use ?? []), middleware],
  });
}

export { useDirectory };
