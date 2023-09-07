import { get } from './get';
import { groupPathsRecursive, isNestedPath } from './group-paths-recursive';
import { Path } from './query-types';

export const transformRecursive = <R>(
  paths: Path[],
  obj: R,
  // whether to return the value on the aliased path or the actual path
  mode: 'alias' | 'path'
): R => {
  const groups = groupPathsRecursive(paths);

  return groups.reduce<R>((prev, curr) => {
    const value = get(obj, curr.path);
    if (typeof value === 'undefined') return prev;
    if (value === null) {
      (prev as Record<string, unknown>)[
        mode === 'alias' && curr.alias ? curr.alias : curr.path
      ] = value;
    } else if (!isNestedPath(curr)) {
      (prev as Record<string, unknown>)[
        mode === 'alias' && curr.alias ? curr.alias : curr.path
      ] = value;
    } else if (Array.isArray(value)) {
      (prev as Record<string, unknown>)[
        mode === 'alias' && curr.alias ? curr.alias : curr.path
      ] = value.map((v) => transformRecursive(curr.paths, v, mode));
    } else {
      (prev as Record<string, unknown>)[
        mode === 'alias' && curr.alias ? curr.alias : curr.path
      ] = transformRecursive(
        curr.paths,
        value as Record<string, unknown>,
        mode
      );
    }
    return prev;
  }, {} as R);
};
