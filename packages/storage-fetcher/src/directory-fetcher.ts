import { FileObject } from "@supabase/storage-js";
import { SupabaseClient } from "@supabase/supabase-js";

export const directoryFetcher = async (
  fileApi: ReturnType<SupabaseClient["storage"]["from"]>,
  path: string
): Promise<FileObject[]> => {
  const { data, error } = await fileApi.list(path);
  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return data;
};
