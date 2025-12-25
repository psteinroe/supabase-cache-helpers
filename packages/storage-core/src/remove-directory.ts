import { fetchDirectory } from './directory-fetcher';
import type { StorageFileApi } from './lib/types';
import { createRemoveFilesFetcher } from './remove-files';

export const createRemoveDirectoryFetcher = (fileApi: StorageFileApi) => {
  const removeFiles = createRemoveFilesFetcher(fileApi);
  return async (path: string) => {
    const files = await fetchDirectory(fileApi, path);
    return await removeFiles(files.map((f) => [path, f.name].join('/')));
  };
};
