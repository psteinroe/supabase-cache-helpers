import {
  type FilterDefinition,
  type FilterDefinitions,
  isAndFilter,
  isFilterDefinition,
  isOrFilter,
} from "./query-types";

// Helper to search for filters in a filter definition
export const findFilters = (
  f: FilterDefinitions,
  by: Partial<FilterDefinition>,
) => {
  const filters: FilterDefinition[] = [];
  f.forEach((filter) => {
    if (isAndFilter(filter)) {
      filters.push(...findFilters(filter.and, by));
    }
    if (isOrFilter(filter)) {
      filters.push(...findFilters(filter.or, by));
    }
    if (isFilterDefinition(filter)) {
      if (
        (typeof by.path === "undefined" || filter.path === by.path) &&
        (typeof by.alias === "undefined" || filter.alias === by.alias) &&
        (typeof by.value === "undefined" || filter.value === by.value) &&
        (typeof by.negate === "undefined" || filter.negate === by.negate) &&
        (typeof by.operator === "undefined" || filter.operator === by.operator)
      ) {
        filters.push(filter);
      }
    }
  });
  return filters;
};
