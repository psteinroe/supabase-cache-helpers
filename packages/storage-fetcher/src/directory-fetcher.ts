import { FileObject } from "@supabase/storage-js";
import { StorageKey } from "./types";

export const directoryFetcher = async (
  key: StorageKey
): Promise<FileObject[]> => {
  if (!Array.isArray(key) || key.length !== 2)
    throw new Error(`Invalid StorageKey`);
  const [fileApi, path] = key;

  const { data, error } = await fileApi.list(path);
  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return data;
};
