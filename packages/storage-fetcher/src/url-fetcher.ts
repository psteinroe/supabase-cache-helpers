import { StorageKey, StoragePrivacy } from "./types";

type URLFetcher = (key: StorageKey) => Promise<string | undefined>;

export type URLFetcherConfig = {
  expiresIn?: number;
  ensureExistence?: boolean;
};

export const createUrlFetcher = (
  mode: StoragePrivacy,
  config?: URLFetcherConfig
): URLFetcher => {
  return async (key: StorageKey): Promise<string | undefined> => {
    if (!Array.isArray(key) || key.length !== 2)
      throw new Error(`Invalid StorageKey`);

    const [fileApi, id] = key;

    let params: Record<string, string> | undefined;
    if (config?.ensureExistence) {
      const pathElements = id.split("/");
      const fileName = pathElements.pop();
      const { data: files } = await fileApi.list(pathElements.join("/"), {
        limit: 1,
        search: fileName,
      });
      if (!files || files.length === 0) return;
      params = {
        updated_at: files[0].updated_at,
      };
    }

    let url: string | undefined;
    if (mode === "private") {
      const { data, error } = await fileApi.createSignedUrl(
        id,
        config?.expiresIn ?? 1800
      );
      if (error) throw error;
      url = data.signedUrl;
    } else if (mode === "public") {
      const { data } = fileApi.getPublicUrl(id);
      url = data.publicUrl;
    }
    if (!params || !url) return url;
    const fileURL = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      fileURL.searchParams.append(key, value);
    });
    return fileURL.toString();
  };
};
