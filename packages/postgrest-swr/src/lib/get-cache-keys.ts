import { Cache, Key } from "swr";

const isMap = (v: unknown): v is Map<unknown, unknown> =>
  typeof (v as Map<unknown, unknown>).keys === "function";

export const getCacheKeys = (cache: Cache): Key[] => {
  if (isMap(cache)) return Array.from(cache.keys()) as Key[];
  return [];
};
