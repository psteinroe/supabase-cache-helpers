import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { StorageError } from "@supabase/storage-js";

import {
  StoragePrivacy,
  createUrlFetcher,
  URLFetcherConfig,
} from "@supabase-cache-helpers/storage-fetcher";
import { StorageKeyInput, middleware, StorageFileApi } from "../lib";
import { useCallback } from "react";

function useFileUrl(
  fileApi: StorageFileApi,
  path: string | null,
  mode: StoragePrivacy,
  config?: SWRConfiguration & URLFetcherConfig
): SWRResponse<string | undefined, StorageError> {
  const fetcher = useCallback(
    ([fileApi, path]: StorageKeyInput) =>
      createUrlFetcher(mode, config)(fileApi, path),
    [config, mode]
  );
  return useSWR(path ? [fileApi, path] : null, fetcher, {
    ...config,
    use: [...(config?.use ?? []), middleware],
  });
}

export { useFileUrl };
