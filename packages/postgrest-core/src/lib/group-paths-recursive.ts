import { Path } from './query-types';
import { removeFirstPathElement } from './remove-first-path-element';

export type NestedPath = {
  alias?: string;
  path: string;
  declaration: string;
  paths: (Path | NestedPath)[];
};

export const isNestedPath = (p: Path | NestedPath): p is NestedPath =>
  Array.isArray((p as NestedPath).paths);

// group paths by first path elements declaration
// returns [Path, Path, NestedPath, NestedPath, Path]
export const groupPathsRecursive = (paths: Path[]): (Path | NestedPath)[] => {
  return paths.reduce<(Path | NestedPath)[]>((prev, curr) => {
    const levels = curr.path.split('.').length;
    if (levels === 1) {
      prev.push(curr);
      return prev;
    }

    // if has more than one level left,
    const firstLevelDeclaration = curr.declaration.split('.')[0];
    const indexOfNested = prev.findIndex(
      (p) => isNestedPath(p) && p.declaration === firstLevelDeclaration,
    );
    const pathWithoutCurrentLevel = removeFirstPathElement(curr);
    if (indexOfNested !== -1) {
      // add to nested
      (prev[indexOfNested] as NestedPath).paths.push(pathWithoutCurrentLevel);
      return prev;
    }
    // create nested
    prev.push({
      declaration: firstLevelDeclaration,
      alias: curr.alias?.split('.')[0],
      path: curr.path.split('.')[0],
      paths: [pathWithoutCurrentLevel],
    });
    return prev;
  }, []);
};
