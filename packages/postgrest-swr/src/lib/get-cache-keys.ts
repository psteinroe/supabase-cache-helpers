import { Cache, Key } from "swr";
import { isMap } from "./is-map";

export const getCacheKeys = (cache: Cache): Key[] => {
  if (isMap(cache)) return Array.from(cache.keys()) as Key[];
  return [];
};
