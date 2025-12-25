import type { StoragePrivacy } from './lib/types';
import type { TransformOptions } from '@supabase/storage-js';
import type StorageFileApi from '@supabase/storage-js/dist/module/packages/StorageFileApi';

type URLFetcher = (
  fileApi: StorageFileApi,
  path: string,
) => Promise<string | undefined>;

export type URLFetcherConfig = {
  expiresIn?: number;
  ensureExistence?: boolean;
  download?: string | boolean | undefined;
  transform?: TransformOptions | undefined;
};

export const createUrlFetcher = (
  mode: StoragePrivacy,
  config?: URLFetcherConfig,
): URLFetcher => {
  return async (
    fileApi: StorageFileApi,
    path: string,
  ): Promise<string | undefined> => {
    let params: Record<string, string> = {};

    if (config?.ensureExistence) {
      const { data: exists } = await fileApi.exists(path);
      if (!exists) return;
      // the `info` endpoint is cached - we need to bust it
      const { data: fileInfo } = await fileApi.info(
        `${path}?bust=${Date.now()}`,
      );
      if (!fileInfo) return;
      const value = fileInfo.lastModified || fileInfo.updatedAt;
      if (!value) return;
      params = {
        updated_at: value,
      };
    }

    let url: string | undefined;
    if (mode === 'private') {
      const { data, error } = await fileApi.createSignedUrl(
        path,
        config?.expiresIn ?? 1800,
        config,
      );
      if (error) throw error;
      url = data.signedUrl;
    } else if (mode === 'public') {
      const { data } = fileApi.getPublicUrl(path, config);
      url = data.publicUrl;
    } else {
      throw new Error(`Invalid mode: ${mode}`);
    }
    const fileURL = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      fileURL.searchParams.append(key, value);
    });
    return fileURL.toString();
  };
};
