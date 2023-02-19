import {
  FilterDefinitions,
  isAndFilter,
  isFilterDefinition,
  isOrFilter,
  parseSelectParam,
  Path,
  PostgrestQueryParser,
} from "@supabase-cache-helpers/postgrest-filter";

export type LoadQueryOps = {
  q?: string;
  parsersForTable: () => PostgrestQueryParser[];
};

const getFirstPathElement = (path: string): string => path.split(".")[0];

type NestedPath = { declaration: string; paths: Path[] };

const isNestedPath = (p: Path | NestedPath): p is NestedPath =>
  Array.isArray((p as NestedPath).paths);

const removeFirstPathElement = (p: Path): Path => {
  const aliasWithoutFirstElement = p.alias
    ? p.alias.split(".").slice(1).join(".")
    : undefined;

  return {
    declaration: p.declaration.split(".").slice(1).join("."),
    path: p.path.split(".").slice(1).join("."),
    alias:
      aliasWithoutFirstElement && aliasWithoutFirstElement.split(":").length > 1
        ? aliasWithoutFirstElement
        : undefined,
  };
};

// Transforms a list of Path[] into a select statement
export const buildSelectStatement = (paths: Path[]): string => {
  // group paths by first path elements declaration
  // returns [Path, Path, NestedPath, NestedPath, Path]
  const groups = paths.reduce<(Path | NestedPath)[]>((prev, curr) => {
    const levels = curr.path.split(".").length;
    if (levels === 1) {
      prev.push(curr);
      return prev;
    }

    const firstLevelDeclaration = getFirstPathElement(curr.declaration);
    const pathWithoutCurrentLevel = removeFirstPathElement(curr);
    const indexOfNested = prev.findIndex(
      (p) => isNestedPath(p) && p.declaration === firstLevelDeclaration
    );
    if (indexOfNested !== -1) {
      // add to nested
      (prev[indexOfNested] as NestedPath).paths.push(pathWithoutCurrentLevel);
      return prev;
    }
    // create nested
    prev.push({
      declaration: firstLevelDeclaration,
      paths: [pathWithoutCurrentLevel],
    });
    return prev;
  }, []);

  return groups
    .map((i) => {
      if (isNestedPath(i)) {
        return `${i.declaration}(${buildSelectStatement(i.paths)})`;
      }
      return `${i.alias ? `${i.alias}:` : ""}${i.path}`;
    })
    .join(",");
};

const extractPathsFromFilters = (f: FilterDefinitions) => {
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

export const loadQuery = ({ q, parsersForTable }: LoadQueryOps) => {
  // parse user query
  const paths: Path[] = q ? parseSelectParam(q) : [];
  for (const parser of parsersForTable()) {
    for (const filterPath of extractPathsFromFilters(parser.filters)) {
      const path = parser.paths.find(
        (p) => p.path === filterPath.path && p.alias === filterPath.alias
      ) ?? {
        ...filterPath,
        declaration: filterPath.path,
      };
      if (paths.every((p) => p.path !== path.path)) {
        // do not use alias
        paths.push({
          path: path.path,
          declaration: path.declaration.split(":").pop() as string,
        });
      }
      for (const path of parser.paths) {
        if (paths.every((p) => p.path !== path.path)) {
          // do not use alias
          paths.push({
            path: path.path,
            declaration: path.declaration.split(":").pop() as string,
          });
        }
      }
    }
  }
  // build query string from paths
  return buildSelectStatement(paths);
};
