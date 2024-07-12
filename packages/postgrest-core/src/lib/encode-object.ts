import flatten from 'flat';

import { sortSearchParams } from './sort-search-param';

/**
 * Encodes an object by url-encoding an ordered lists of all paths and their values.
 */
export const encodeObject = (obj: Record<string, unknown>): string => {
  const sortedEntries = Object.entries(
    flatten(obj) as Record<string, unknown>,
  ).sort(([a], [b]) => a.length - b.length);
  const bodyParams = new URLSearchParams();
  sortedEntries.forEach(([key, value]) => {
    bodyParams.append(key, String(value));
  });
  return sortSearchParams(bodyParams).toString();
};
