import {
  isAndFilter,
  isOrFilter,
  isFilterDefinition,
  Path,
  FilterDefinitions,
} from './query-types';

export const extractPathsFromFilters = (f: FilterDefinitions, p: Path[]) => {
  return f.reduce<Path[]>((prev, filter) => {
    if (isAndFilter(filter)) {
      prev.push(...extractPathsFromFilters(filter.and, p));
    } else if (isOrFilter(filter)) {
      prev.push(...extractPathsFromFilters(filter.or, p));
    } else if (isFilterDefinition(filter)) {
      const relatedPath = p.find((p) => p.path === filter.path);
      const pathElements = filter.path.split('.');
      const aliasElements = filter.alias?.split('.');
      const declaration = pathElements
        .map(
          (el, idx) =>
            `${
              aliasElements && aliasElements[idx] !== el
                ? `${aliasElements[idx]}:`
                : ''
            }${el}`,
        )
        .join('.');
      prev.push({
        path: filter.path,
        alias: filter.alias,
        declaration: relatedPath ? relatedPath.declaration : declaration,
      });
    }
    return prev;
  }, []);
};
