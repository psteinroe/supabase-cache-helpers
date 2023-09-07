import { FileObject } from '@supabase/storage-js';
import StorageFileApi from '@supabase/storage-js/dist/module/packages/StorageFileApi';

import { fetchDirectory } from './directory-fetcher';
import { StoragePrivacy } from './lib/types';
import { createUrlFetcher, URLFetcherConfig } from './url-fetcher';

type DirectoryURLsFetcher = (
  fileApi: StorageFileApi,
  path: string
) => Promise<(FileObject & { url: string })[]>;

export const createDirectoryUrlsFetcher = (
  mode: StoragePrivacy,
  config?: Pick<URLFetcherConfig, 'expiresIn'>
): DirectoryURLsFetcher => {
  const fetchUrl = createUrlFetcher(mode, config);
  return async (fileApi: StorageFileApi, path) => {
    const files = await fetchDirectory(fileApi, path);
    const filesWithUrls = [];
    for (const f of files) {
      const url = await fetchUrl(fileApi, `${path}/${f.name}`);
      if (url) filesWithUrls.push({ ...f, url });
    }
    return filesWithUrls;
  };
};
