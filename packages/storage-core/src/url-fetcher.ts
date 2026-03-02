import type { StorageFileApi, StoragePrivacy } from './lib/types';
import type { TransformOptions } from '@supabase/storage-js';

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
      const lastSlash = path.lastIndexOf('/');
      const prefix = lastSlash >= 0 ? path.substring(0, lastSlash) : undefined;
      const fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;

      const { data: files, error } = await fileApi.list(prefix ?? undefined, {
        search: fileName,
        limit: 1,
      });

      if (error) throw error;

      const file = files?.find((f) => f.name === fileName);
      if (!file) return;

      params = {
        updated_at: file.updated_at ?? '',
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
