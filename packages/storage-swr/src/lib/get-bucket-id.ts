import { StorageFileApi } from "./types";

export const getBucketId = (fileApi: StorageFileApi) =>
  fileApi["bucketId"] as string;
