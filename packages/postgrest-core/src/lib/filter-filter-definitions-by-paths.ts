import {
  type FilterDefinitions,
  isAndFilter,
  isFilterDefinition,
  isOrFilter,
} from './query-types';

export const filterFilterDefinitionsByPaths = (
  f: FilterDefinitions,
  paths: string[],
) => {
  return f.reduce<FilterDefinitions>((prev, filter) => {
    if (isAndFilter(filter)) {
      const filters = filterFilterDefinitionsByPaths(filter.and, paths);
      if (filters.length > 0) {
        prev.push({ and: filters });
      }
    } else if (isOrFilter(filter)) {
      const filters = filterFilterDefinitionsByPaths(filter.or, paths);
      if (filters.length > 0) {
        prev.push({ or: filters });
      }
    } else if (isFilterDefinition(filter) && paths.includes(filter.path)) {
      prev.push(filter);
    }
    return prev;
  }, []);
};
