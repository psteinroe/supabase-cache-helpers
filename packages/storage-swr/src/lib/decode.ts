import type { DecodedStorageKey } from "@supabase-cache-helpers/storage-core";
import type { Key } from "swr";

import { KEY_PREFIX, KEY_SEPARATOR } from "./constants";

export const decode = (key: Key): DecodedStorageKey | null => {
  if (typeof key !== "string" || !key.startsWith(KEY_PREFIX)) return null;
  const [_, bucketId, path] = key.split(KEY_SEPARATOR);
  return { bucketId, path };
};
