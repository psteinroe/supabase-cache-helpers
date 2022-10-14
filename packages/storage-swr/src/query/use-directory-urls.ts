import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { FileObject, StorageError } from "@supabase/storage-js";

import {
  createDirectoryUrlsFetcher,
  StoragePrivacy,
  URLFetcherConfig,
} from "@supabase-cache-helpers/storage-fetcher";

import { StorageKeyInput, middleware, StorageFileApi } from "../lib";
import { useCallback } from "react";

function useDirectoryFileUrls(
  fileApi: StorageFileApi,
  path: string | null,
  mode: StoragePrivacy,
  config?: SWRConfiguration & Pick<URLFetcherConfig, "expiresIn">
): SWRResponse<(FileObject & { url: string })[] | null, StorageError> {
  const fetcher = useCallback(
    ([fileApi, path]: StorageKeyInput) =>
      createDirectoryUrlsFetcher(mode, config)(fileApi, path),
    [mode, config]
  );
  return useSWR(path ? [fileApi, path] : null, fetcher, {
    ...config,
    use: [...(config?.use ?? []), middleware],
  });
}

export { useDirectoryFileUrls };
