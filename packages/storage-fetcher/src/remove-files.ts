import StorageFileApi from '@supabase/storage-js/dist/module/packages/StorageFileApi';

export const createRemoveFilesFetcher =
  (fileApi: StorageFileApi) => async (paths: string[]) => {
    const { data, error } = await fileApi.remove(paths);
    if (error) throw error;
    return data;
  };
