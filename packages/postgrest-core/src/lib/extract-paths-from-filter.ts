import {
  isAndFilter,
  isOrFilter,
  isFilterDefinition,
  Path,
  FilterDefinitions,
} from './query-types';

export const extractPathsFromFilters = (f: FilterDefinitions) => {
  return f.reduce<Path[]>((prev, filter) => {
    if (isAndFilter(filter)) {
      prev.push(...extractPathsFromFilters(filter.and));
    } else if (isOrFilter(filter)) {
      prev.push(...extractPathsFromFilters(filter.or));
    } else if (isFilterDefinition(filter)) {
      const pathElements = filter.path.split('.');
      const aliasElements = filter.alias?.split('.');
      const declaration = pathElements
        .map(
          (el, idx) => `${aliasElements ? `${aliasElements[idx]}:` : ''}${el}`,
        )
        .join('.');
      prev.push({ path: filter.path, alias: filter.alias, declaration });
    }
    return prev;
  }, []);
};
