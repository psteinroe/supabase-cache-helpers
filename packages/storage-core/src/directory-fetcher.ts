import type { StorageFileApi } from './lib/types';
import type { FileObject } from '@supabase/storage-js';

export const fetchDirectory = async (
  fileApi: StorageFileApi,
  path: string,
): Promise<FileObject[]> => {
  const { data, error } = await fileApi.list(path);
  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return data;
};
