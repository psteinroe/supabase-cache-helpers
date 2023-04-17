import { FileOptions } from '@supabase/storage-js';
import StorageFileApi from '@supabase/storage-js/dist/module/packages/StorageFileApi';

export type BuildFileNameFn = ({
  path,
  fileName,
}: {
  path?: string;
  fileName: string;
}) => string;

const defaultBuildFileName: BuildFileNameFn = ({ path, fileName }) =>
  [path, fileName].filter(Boolean).join('/');

export type UploadFetcherConfig = Partial<
  Pick<FileOptions, 'cacheControl' | 'upsert'>
> & {
  buildFileName?: BuildFileNameFn;
};

export type UploadFileResponse = Awaited<ReturnType<StorageFileApi['upload']>>;

export type ArrayBufferFile = {
  data: ArrayBuffer;
  type?: string;
  name: string;
};

export type FileInput = File | ArrayBufferFile;

const isArrayBufferFile = (i: FileInput): i is ArrayBufferFile =>
  Boolean((i as ArrayBufferFile).data);

export const createUploadFetcher = (
  fileApi: StorageFileApi,
  config?: UploadFetcherConfig
) => {
  const buildFileName = config?.buildFileName ?? defaultBuildFileName;
  return async (
    files: FileList | (File | ArrayBufferFile)[],
    path?: string
  ): Promise<UploadFileResponse[]> => {
    // convert FileList into File[]
    const inputFiles: FileInput[] = [];
    for (let i = 0; i < files.length; i++) {
      inputFiles.push(files[i]);
    }
    const uploading = inputFiles.map(async (f) => {
      const res = await fileApi.upload(
        buildFileName({ path, fileName: f.name }).replace(
          // remove double "/"
          new RegExp('/+', 'g'),
          '/'
        ),
        isArrayBufferFile(f) ? f.data : f,
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
