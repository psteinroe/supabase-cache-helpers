import {
  type NestedPath,
  groupPathsRecursive,
  isNestedPath,
} from '../lib/group-paths-recursive';
import type { Path } from '../lib/query-types';

// Transforms a list of Path[] into a select statement
export const buildSelectStatement = (paths: Path[]): string => {
  return buildSelectStatementFromGroupedPaths(groupPathsRecursive(paths));
};

// Transforms a list of (Path | NestedPath)[] grouped statements into a select statement
export const buildSelectStatementFromGroupedPaths = (
  paths: (Path | NestedPath)[],
): string =>
  paths
    .map((i) => {
      if (isNestedPath(i)) {
        return `${i.declaration}(${buildSelectStatement(i.paths)})`;
      }
      return `${i.alias ? `${i.alias}:` : ''}${i.path}`;
    })
    .join(',');
