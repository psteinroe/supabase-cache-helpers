import type { StorageFileApi } from './lib/types';

export const createRemoveFilesFetcher =
  (fileApi: StorageFileApi) => async (paths: string[]) => {
    const { data, error } = await fileApi.remove(paths);
    if (error) throw error;
    return data;
  };
