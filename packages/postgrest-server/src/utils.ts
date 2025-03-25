import { Value } from './stores/entry';

/**
 * A result is empty if
 * - it does not contain a truhty data field
 * - it does not contain a count field
 * - data is an empty array
 *
 * @template Result - The Result of the query
 * @param result - The value to check
 * @returns true if the result is empty
 */
export function isEmpty<Result>(result: Value<Result>) {
  if (typeof result.count === 'number') {
    return false;
  }

  if (!result.data) {
    return true;
  }

  if (Array.isArray(result.data)) {
    return result.data.length === 0;
  }

  return false;
}
