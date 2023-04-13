import {
  Path,
  groupPathsRecursive,
  isNestedPath,
} from '@supabase-cache-helpers/postgrest-filter';

// Transforms a list of Path[] into a select statement
export const buildSelectStatement = (paths: Path[]): string => {
  return groupPathsRecursive(paths)
    .map((i) => {
      if (isNestedPath(i)) {
        return `${i.declaration}(${buildSelectStatement(i.paths)})`;
      }
      return `${i.alias ? `${i.alias}:` : ''}${i.path}`;
    })
    .join(',');
};
