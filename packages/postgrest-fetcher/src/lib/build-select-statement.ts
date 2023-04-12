import { Path } from '@supabase-cache-helpers/postgrest-filter';

import { getFirstPathElement } from './get-first-path-element';
import { removeFirstPathElement } from './remove-first-path-element';

type NestedPath = { declaration: string; paths: Path[] };

const isNestedPath = (p: Path | NestedPath): p is NestedPath =>
  Array.isArray((p as NestedPath).paths);

// Transforms a list of Path[] into a select statement
export const buildSelectStatement = (paths: Path[]): string => {
  // group paths by first path elements declaration
  // returns [Path, Path, NestedPath, NestedPath, Path]
  const groups = paths.reduce<(Path | NestedPath)[]>((prev, curr) => {
    const levels = curr.path.split('.').length;
    if (levels === 1) {
      prev.push(curr);
      return prev;
    }

    const firstLevelDeclaration = getFirstPathElement(curr.declaration);
    const pathWithoutCurrentLevel = removeFirstPathElement(curr);
    const indexOfNested = prev.findIndex(
      (p) => isNestedPath(p) && p.declaration === firstLevelDeclaration
    );
    if (indexOfNested !== -1) {
      // add to nested
      (prev[indexOfNested] as NestedPath).paths.push(pathWithoutCurrentLevel);
      return prev;
    }
    // create nested
    prev.push({
      declaration: firstLevelDeclaration,
      paths: [pathWithoutCurrentLevel],
    });
    return prev;
  }, []);

  return groups
    .map((i) => {
      if (isNestedPath(i)) {
        return `${i.declaration}(${buildSelectStatement(i.paths)})`;
      }
      return `${i.alias ? `${i.alias}:` : ''}${i.path}`;
    })
    .join(',');
};
