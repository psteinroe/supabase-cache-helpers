import {
  parseSelectParam,
  Path,
  PostgrestQueryParser,
} from "@supabase-cache-helpers/postgrest-filter";

export type BuildQueryOps<Key> = {
  table: string;
  q?: string;
  keysForTable: (table: string) => Key[];
  decode: (k: Key) => { table: string; query: string };
  getPostgrestParser: (query: string) => PostgrestQueryParser;
};

const getFirstPathElement = (path: string): string => path.split(".")[0];

type NestedPath = { prefix: string; paths: Path[] };

const isNestedPath = (p: Path | NestedPath): p is NestedPath =>
  Boolean((p as NestedPath).prefix);

const removeFirstPathElement = (p: Path): Path => ({
  path: p.path.split(".").slice(1).join("."),
  alias: p.alias ? p.alias.split(".").slice(1).join(".") : p.alias,
});

// Transforms a list of Path[] into a select statement
export const buildSelectStatement = (paths: Path[]): string => {
  // group paths by first element
  // returns [Path, Path, [Path, Path], Path]
  const groups = paths.reduce<(Path | NestedPath)[]>((prev, curr) => {
    const levels = curr.path.split(".").length;
    if (levels === 1) {
      prev.push(curr);
      return prev;
    }

    const firstLevelPath = `${
      curr.alias ? `${getFirstPathElement(curr.alias)}:` : ""
    }${getFirstPathElement(curr.path)}`;
    const pathWithoutCurrentLevel = removeFirstPathElement(curr);
    const indexOfNested = prev.findIndex(
      (p) => isNestedPath(p) && p.prefix === firstLevelPath
    );
    if (indexOfNested) {
      // add to nested
      (prev[indexOfNested] as NestedPath).paths.push(
        removeFirstPathElement(pathWithoutCurrentLevel)
      );
      return prev;
    }
    //create nested.
    prev.push({
      prefix: firstLevelPath,
      paths: [removeFirstPathElement(pathWithoutCurrentLevel)],
    });
    return prev;
  }, []);

  return groups
    .map((i) => {
      if (isNestedPath(i)) {
        return `${i.prefix}(${buildSelectStatement(i.paths)})`;
      }
      return `${i.alias ? `${i.alias}:` : ""}${i.path}`;
    })
    .join(",");
};

export const loadQuery = <Key>({
  table,
  q,
  keysForTable,
  decode,
  getPostgrestParser,
}: BuildQueryOps<Key>) => {
  // load all keys for table
  const keys = keysForTable(table);
  // parse user query
  const userQueryPaths = q ? parseSelectParam(q) : [];
  const paths = [
    ...userQueryPaths,
    // get filter builders for all of them, and get paths
    ...keys.flatMap((k) => {
      const { query } = decode(k);
      return getPostgrestParser(query).paths;
    }),
  ];
  // get unique paths
  const uqPaths = [...new Set(paths.map((p) => p.path))];
  // add aliases from user-defined query
  const pathsToQuery = uqPaths.map((p) => {
    const userPath = userQueryPaths.find((uq) => uq.path === p);
    return userPath ? userPath : { path: p };
  });
  // build query string from paths
  return buildSelectStatement(pathsToQuery);
};
