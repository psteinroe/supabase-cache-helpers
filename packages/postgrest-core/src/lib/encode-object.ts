import { flatten, unflatten } from 'flat';

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

/**
 * Decodes a URL-encoded string back into a nested object.
 * This is the reverse operation of encodeObject.
 */
export const decodeObject = (
  encodedString: string,
): Record<string, unknown> => {
  const params = new URLSearchParams(encodedString);
  const flatObject: Record<string, unknown> = {};

  // Convert URLSearchParams back to a flat object
  params.forEach((value, key) => {
    // Try to convert string values to appropriate types
    let parsedValue: unknown = value;

    // Try to parse numbers
    if (/^-?\d+$/.test(value)) {
      parsedValue = parseInt(value, 10);
    } else if (/^-?\d+\.\d+$/.test(value)) {
      parsedValue = parseFloat(value);
    } else if (value === 'true') {
      parsedValue = true;
    } else if (value === 'false') {
      parsedValue = false;
    } else if (value === 'null') {
      parsedValue = null;
    }

    flatObject[key] = parsedValue;
  });

  // Unflatten the object to restore nested structure
  return unflatten(flatObject);
};
