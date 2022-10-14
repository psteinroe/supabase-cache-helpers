import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { FileObject, StorageError } from "@supabase/storage-js";

import { fetchDirectory } from "@supabase-cache-helpers/storage-fetcher";

import { middleware, StorageKeyInput, StorageFileApi } from "../lib";
import { useCallback } from "react";

function useDirectory(
  fileApi: StorageFileApi,
  path: string | null,
  config?: SWRConfiguration
): SWRResponse<FileObject[] | null, StorageError> {
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
