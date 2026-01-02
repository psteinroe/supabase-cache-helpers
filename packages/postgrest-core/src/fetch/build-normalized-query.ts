import { extractPathsFromFilters } from '../lib/extract-paths-from-filter';
import {
  type NestedPath,
  groupPathsRecursive,
} from '../lib/group-paths-recursive';
import { parseSelectParam } from '../lib/parse-select-param';
import type { FilterDefinitions, Path } from '../lib/query-types';
import { removeAliasFromDeclaration } from '../lib/remove-alias-from-declaration';
import { buildSelectStatementFromGroupedPaths } from './build-select-statement';
import { dedupeGroupedPathsRecursive } from './dedupe';

export type BuildNormalizedQueryOps<Q extends string = '*'> = {
  query?: Q | null;
  queriesForTable: () => { paths: Path[]; filters: FilterDefinitions }[];
};

export type BuildNormalizedQueryReturn = {
  // The joint select query
  selectQuery: string;
  // All paths the user is querying for
  groupedUserQueryPaths: (NestedPath | Path)[] | null;
  // All paths the user is querying for + all paths that are currently loaded into the cache
  groupedPaths: (NestedPath | Path)[];
};

/**
 * returns select statement that includes the users query + all paths currently loaded into cache to later perform a "smart update"
 *
 * the select statement does not contain any user-defined aliases. only custom ones to dedupe.
 * without deduping, we would not be able to query inbox_id,inbox:inbox_id(name),
 * because it will result in a select of inbox_id,inbox_id(name), which does not work.
 * to dedupe, we add a custom alias to the query, e.g. dedupe_0:inbox_id,inbox_id(name)
 * we then later remove them when normalizing the data
 **/
export const buildNormalizedQuery = <Q extends string = '*'>({
  query,
  queriesForTable,
}: BuildNormalizedQueryOps<Q>): BuildNormalizedQueryReturn | null => {
  // parse user query
  const userQueryPaths = query ? parseSelectParam(query) : null;

  // unique set of declaration without paths.
  // alias not needed for paths
  // declaration without alias!
  const paths: Path[] = userQueryPaths
    ? userQueryPaths.map((q) => ({
        declaration: removeAliasFromDeclaration(q.declaration),
        path: q.path,
      }))
    : [];

  for (const tableQuery of queriesForTable()) {
    for (const filterPath of extractPathsFromFilters(
      tableQuery.filters,
      tableQuery.paths,
    )) {
      // add paths used in filter
      const path = tableQuery.paths.find(
        (p) => p.path === filterPath.path && p.alias === filterPath.alias,
      ) ?? {
        path: filterPath.path,
        declaration: filterPath.path,
      };
      // add unique
      if (
        paths.every(
          (p) =>
            removeAliasFromDeclaration(p.declaration) !==
            removeAliasFromDeclaration(path.declaration),
        )
      ) {
        // do not use alias
        paths.push({
          path: path.path,
          declaration: removeAliasFromDeclaration(path.declaration),
        });
      }
    }
  }

  const groupedPaths = groupPathsRecursive(paths);
  const groupedDedupedPaths = dedupeGroupedPathsRecursive(groupedPaths);

  const selectQuery = buildSelectStatementFromGroupedPaths(groupedDedupedPaths);
  if (selectQuery.length === 0) return null;
  return {
    selectQuery,
    groupedUserQueryPaths: userQueryPaths
      ? groupPathsRecursive(userQueryPaths)
      : null,
    groupedPaths: groupedDedupedPaths,
  };
};
