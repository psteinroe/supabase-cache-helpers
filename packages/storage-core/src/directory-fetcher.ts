import { FileObject } from '@supabase/storage-js';
import StorageFileApi from '@supabase/storage-js/dist/module/packages/StorageFileApi';

export const fetchDirectory = async (
  fileApi: StorageFileApi,
  path: string,
): Promise<FileObject[]> => {
  const { data, error } = await fileApi.list(path);
  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return data;
};
