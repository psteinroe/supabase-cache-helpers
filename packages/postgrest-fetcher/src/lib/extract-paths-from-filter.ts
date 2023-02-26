import {
  FilterDefinitions,
  isAndFilter,
  isFilterDefinition,
  isOrFilter,
  Path,
} from "@supabase-cache-helpers/postgrest-filter";

export const extractPathsFromFilters = (f: FilterDefinitions) => {
  return f.reduce<Pick<Path, "path" | "alias">[]>((prev, filter) => {
    if (isAndFilter(filter)) {
      prev.push(...extractPathsFromFilters(filter.and));
    } else if (isOrFilter(filter)) {
      prev.push(...extractPathsFromFilters(filter.or));
    } else if (isFilterDefinition(filter)) {
      prev.push({ path: filter.path, alias: filter.alias });
    }
    return prev;
  }, []);
};
