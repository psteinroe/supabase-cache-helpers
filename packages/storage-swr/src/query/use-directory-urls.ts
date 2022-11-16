import {
  createDirectoryUrlsFetcher,
  StoragePrivacy,
  URLFetcherConfig,
} from "@supabase-cache-helpers/storage-fetcher";
import { FileObject, StorageError } from "@supabase/storage-js";
import { useCallback } from "react";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";

import { StorageKeyInput, middleware, StorageFileApi } from "../lib";

function useDirectoryFileUrls(
  fileApi: StorageFileApi,
  path: string | null,
  mode: StoragePrivacy,
  config?: SWRConfiguration & Pick<URLFetcherConfig, "expiresIn">
): SWRResponse<(FileObject & { url: string })[] | undefined, StorageError> {
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
