import {
  FilterDefinitions,
  parseSelectParam,
  Path,
  extractPathsFromFilters,
} from "@supabase-cache-helpers/postgrest-filter";

import { buildSelectStatement } from "./build-select-statement";
import { removeAliasFromDeclaration } from "./remove-alias-from-declaration";

export type LoadQueryOps = {
  query?: string;
  queriesForTable: () => { paths: Path[]; filters: FilterDefinitions }[];
};

export type LoadQueryReturn = {
  selectQuery: string;
  userQueryPaths: Path[] | null;
  paths: Path[];
};

// returns select statement that includes all paths currently loaded into cache to later perform a "smart update"
export const loadQuery = ({
  query,
  queriesForTable,
}: LoadQueryOps): LoadQueryReturn | null => {
  // parse user query
  const userQueryPaths = query ? parseSelectParam(query) : null;

  // cache data paths
  const paths: Path[] = userQueryPaths ?? [];
  for (const tableQuery of queriesForTable()) {
    for (const filterPath of extractPathsFromFilters(tableQuery.filters)) {
      // add paths used in filter
      const path = tableQuery.paths.find(
        (p) => p.path === filterPath.path && p.alias === filterPath.alias
      ) ?? {
        ...filterPath,
        declaration: filterPath.path,
      };
      // add unique
      if (
        paths.every(
          (p) =>
            removeAliasFromDeclaration(p.declaration) !==
            removeAliasFromDeclaration(path.declaration)
        )
      ) {
        // do not use alias
        paths.push({
          path: path.path,
          declaration: path.declaration.split(":").pop() as string,
        });
      }
      // add paths used in query
      for (const path of tableQuery.paths) {
        if (
          paths.every(
            (p) =>
              removeAliasFromDeclaration(p.declaration) !==
              removeAliasFromDeclaration(path.declaration)
          )
        ) {
          // do not use alias
          paths.push({
            path: path.path,
            declaration: path.declaration.split(":").pop() as string,
          });
        }
      }
    }
  }
  const selectQuery = buildSelectStatement(paths);
  if (selectQuery.length === 0) return null;
  return { selectQuery, userQueryPaths, paths };
};
