import { buildSelectStatement } from './build-select-statement';
import { buildDedupePath } from './dedupe';
import { extractPathsFromFilters } from '../lib/extract-paths-from-filter';
import { parseSelectParam } from '../lib/parse-select-param';
import { FilterDefinitions, Path } from '../lib/query-types';
import { removeAliasFromDeclaration } from '../lib/remove-alias-from-declaration';

export type BuildNormalizedQueryOps<Q extends string = '*'> = {
  query?: Q | null;
  // if true, will not add any paths from the cache to the query
  disabled?: boolean;
  queriesForTable: () => { paths: Path[]; filters: FilterDefinitions }[];
};

export type BuildNormalizedQueryReturn = {
  // The joint select query
  selectQuery: string;
  // All paths the user is querying for
  userQueryPaths: Path[] | null;
  // All paths the user is querying for + all paths that are currently loaded into the cache
  paths: Path[];
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
  disabled,
  queriesForTable,
}: BuildNormalizedQueryOps<Q>): BuildNormalizedQueryReturn | null => {
  // parse user query
  const userQueryPaths = query ? parseSelectParam(query) : null;

  // unique set of declaration without paths.
  // alias not needed for paths
  // declaration without alias!
  let paths: Path[] = userQueryPaths
    ? userQueryPaths.map((q) => ({
        declaration: removeAliasFromDeclaration(q.declaration),
        path: q.path,
      }))
    : [];

  if (!disabled) {
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
      // add paths used in query
      for (const path of tableQuery.paths) {
        if (
          paths.every(
            (p) =>
              removeAliasFromDeclaration(p.declaration) !==
              removeAliasFromDeclaration(path.declaration),
          ) &&
          // do not add agg functions
          !path.declaration.endsWith('.count')
        ) {
          paths.push({
            path: path.path,
            declaration: removeAliasFromDeclaration(path.declaration),
          });
        }
      }
    }
  }

  // dedupe paths by adding an alias to the shortest path,
  // e.g. inbox_id,inbox_id(name) -> d_0:inbox_id,inbox_id(name),
  let dedupeCounter = 0;
  paths = paths.map((p, _, a) => {
    // check if there is path that starts with the same declaration but is longer
    // e.g. path is "inbox_id", and there is an "inbox_id(name)" in the cache
    if (a.some((i) => i.path.startsWith(`${p.path}.`))) {
      // if that is the case, add our dedupe alias to the query
      // the alias has to be added to the last path element only,
      // e.g. relation_id.some_id -> relation_id.d_0_some_id:some_id
      return buildDedupePath(dedupeCounter++, p);
    } else {
      // otherwise, leave the path as is
      return p;
    }
  });

  const selectQuery = buildSelectStatement(paths);
  if (selectQuery.length === 0) return null;
  return { selectQuery, userQueryPaths, paths };
};
