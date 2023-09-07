/**
 * Returns all paths of an object in dot notation
 * @param obj
 * @param prev
 * @returns
 */
export const getAllPaths = (
  obj: Record<string, unknown>,
  prev = ''
): string[] => {
  const result = [];

  for (const k in obj) {
    const path = prev + (prev ? '.' : '') + k;

    if (typeof obj[k] == 'object') {
      result.push(...getAllPaths(obj[k] as Record<string, unknown>, path));
    } else result.push(path);
  }

  return result;
};
