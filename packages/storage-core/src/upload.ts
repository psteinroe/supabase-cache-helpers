import type { FileOptions } from '@supabase/storage-js';
import type StorageFileApi from '@supabase/storage-js/dist/module/packages/StorageFileApi';

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

export type UploadFileInput = {
  data: Parameters<StorageFileApi['upload']>[1];
  type?: string;
  name: string;
  metadata?: NonNullable<Parameters<StorageFileApi['upload']>[2]>['metadata'];
};

export type FileInput = File | UploadFileInput;

const isUploadFileInput = (i: FileInput): i is UploadFileInput =>
  Boolean((i as UploadFileInput).data);

export const createUploadFetcher = (
  fileApi: StorageFileApi,
  config?: UploadFetcherConfig,
) => {
  const buildFileName = config?.buildFileName ?? defaultBuildFileName;
  return async (
    files: FileList | FileInput[],
    path?: string,
  ): Promise<UploadFileResponse[]> => {
    // convert FileList into File[]
    const inputFiles: FileInput[] = [];
    for (let i = 0; i < files.length; i++) {
      inputFiles.push(files[i]);
    }
    const uploading = inputFiles.map(async (f) => {
      const res = await fileApi.upload(
        buildFileName({
          path,
          fileName: f.name,
        }).replace(
          // remove double "/"
          /\/+/g,
          '/',
        ),
        isUploadFileInput(f) ? f.data : f,
        {
          contentType: f.type,
          metadata: isUploadFileInput(f)? f.metadata : undefined,
          ...config,
        },
      );
      return res;
    });
    return await Promise.all(uploading);
  };
};
