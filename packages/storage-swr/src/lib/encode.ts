import { Key } from "swr";
import { KEY_PREFIX, KEY_SEPARATOR } from "./constants";
import { getBucketId } from "./get-bucket-id";
import { assertStorageKeyInput } from "./key";

export const encode = (key: Key | null): Key => {
  if (key === null) return null;
  const [fileApi, path] = assertStorageKeyInput(key);
  return [KEY_PREFIX, getBucketId(fileApi), path].join(KEY_SEPARATOR);
};
