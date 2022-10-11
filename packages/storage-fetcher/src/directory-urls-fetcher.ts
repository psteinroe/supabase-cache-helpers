import { FileObject } from "@supabase/storage-js";
import { directoryFetcher } from "./directory-fetcher";
import { StorageKey, StoragePrivacy } from "./types";
import { createURLFetcher, URLFetcherConfig } from "./url-fetcher";

type DirectoryURLsFetcher = (
  key: StorageKey
) => Promise<(FileObject & { url: string })[]>;

export const createDirectoryUrlsFetcher = (
  mode: StoragePrivacy,
  config?: Pick<URLFetcherConfig, "expiresIn">
): DirectoryURLsFetcher => {
  const urlFetcher = createURLFetcher(mode, config);

  return async (key) => {
    const files = await directoryFetcher(key);
    const [client, dirName] = key;

    const filesWithUrls = [];
    for (const f of files) {
      const url = await urlFetcher([client, `${dirName}/${f.name}`]);
      if (url) filesWithUrls.push({ ...f, url });
    }

    return filesWithUrls;
  };
};
