import { FileObject } from "@supabase/storage-js";
import { SupabaseClient } from "@supabase/supabase-js";
import { directoryFetcher } from "./directory-fetcher";
import { StoragePrivacy } from "./types";
import { createUrlFetcher, URLFetcherConfig } from "./url-fetcher";

type DirectoryURLsFetcher = (
  fileApi: ReturnType<SupabaseClient["storage"]["from"]>,
  dirName: string
) => Promise<(FileObject & { url: string })[]>;

export const createDirectoryUrlsFetcher = (
  mode: StoragePrivacy,
  config?: Pick<URLFetcherConfig, "expiresIn">
): DirectoryURLsFetcher => {
  const urlFetcher = createUrlFetcher(mode, config);

  return async (fileApi, dirName) => {
    const files = await directoryFetcher(fileApi, dirName);

    const filesWithUrls = [];
    for (const f of files) {
      const url = await urlFetcher(fileApi, `${dirName}/${f.name}`);
      if (url) filesWithUrls.push({ ...f, url });
    }

    return filesWithUrls;
  };
};
