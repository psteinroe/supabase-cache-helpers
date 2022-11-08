import { FileOptions } from "@supabase/storage-js";
import StorageFileApi from "@supabase/storage-js/dist/module/packages/StorageFileApi";

export type BuildFileNameFn = ({
  path,
  fileName,
}: {
  path?: string;
  fileName: string;
}) => string;

const defaultBuildFileName: BuildFileNameFn = ({ path, fileName }) =>
  [path, fileName].filter(Boolean).join("/");

export type UploadFetcherConfig = Pick<
  FileOptions,
  "cacheControl" | "upsert"
> & {
  buildFileName?: BuildFileNameFn;
};

export type UploadFileResponse = Awaited<ReturnType<StorageFileApi["upload"]>>;

export const createUploadFetcher = (
  fileApi: StorageFileApi,
  config?: UploadFetcherConfig
) => {
  const buildFileName = config?.buildFileName ?? defaultBuildFileName;
  return async (
    files: FileList | File[],
    path?: string
  ): Promise<UploadFileResponse[]> => {
    const inputFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      inputFiles.push(files[i]);
    }
    const uploading = inputFiles.map(async (f) => {
      const res = await fileApi.upload(
        buildFileName({ path, fileName: f.name }).replace(
          new RegExp("/+", "g"),
          "/"
        ),
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
};
