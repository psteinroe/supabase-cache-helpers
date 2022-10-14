import { FileOptions } from "@supabase/storage-js";
import StorageFileApi from "@supabase/storage-js/dist/module/packages/StorageFileApi";

export type UploadFetcherConfig = Pick<FileOptions, "cacheControl" | "upsert">;

export type UploadFileResponse = Awaited<ReturnType<StorageFileApi["upload"]>>;

export const createUploadFetcher =
  (fileApi: StorageFileApi, prefix?: string, config?: UploadFetcherConfig) =>
  async (
    files: FileList | File[],
    path?: string
  ): Promise<UploadFileResponse[]> => {
    const inputFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      inputFiles.push(files[i]);
    }
    const uploading = inputFiles.map(async (f) => {
      const res = await fileApi.upload(
        [prefix, path, f.name]
          .filter(Boolean)
          .join("/")
          .replace(new RegExp("/+", "g"), "/"),
        f,
        {
          contentType: f.type,
          ...config,
        }
      );
      return res;
    });
    return await Promise.all(uploading);
  };
