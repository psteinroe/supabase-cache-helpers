import { get } from './get';
import { getAllPaths } from './get-all-paths';
import { sortSearchParams } from './sort-search-param';

/**
 * Encodes an object by url-encoding an ordered lists of all paths and their values.
 * @param obj The object to encode
 * @returns The encoded object
 */
export const encodeObject = (obj: Record<string, unknown>): string => {
  const paths = getAllPaths(obj).sort();
  const bodyParams = new URLSearchParams();
  paths.forEach((key) => {
    const value = get(obj, key);
    bodyParams.append(key, String(value));
  });
  return sortSearchParams(bodyParams).toString();
};
