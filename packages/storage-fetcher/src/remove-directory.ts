import StorageFileApi from "@supabase/storage-js/dist/module/packages/StorageFileApi";
import { fetchDirectory } from "./directory-fetcher";
import { createRemoveFilesFetcher } from "./remove-files";

export const createRemoveDirectoryFetcher = (fileApi: StorageFileApi) => {
  const removeFiles = createRemoveFilesFetcher(fileApi);
  return async (path: string) => {
    const files = await fetchDirectory(fileApi, path);
    return await removeFiles(files.map((f) => [path, f.name].join("/")));
  };
};
