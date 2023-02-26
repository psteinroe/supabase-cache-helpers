import {
  FilterDefinitions,
  parseSelectParam,
  Path,
} from "@supabase-cache-helpers/postgrest-filter";

import { buildSelectStatement } from "./build-select-statement";
import { extractPathsFromFilters } from "./extract-paths-from-filter";
import { removeAliasFromDeclaration } from "./remove-alias-from-declaration";

export type LoadQueryOps = {
  query?: string;
  queriesForTable: () => { paths: Path[]; filters: FilterDefinitions }[];
};

// returns select statement that includes all paths currently loaded into cache to later perform a "smart update"
export const loadQuery = ({ query, queriesForTable }: LoadQueryOps) => {
  // parse user query
  const paths: Path[] = query ? parseSelectParam(query) : [];
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
  const statement = buildSelectStatement(paths);
  if (statement.length === 0) return null;
  return statement;
};
