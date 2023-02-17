import XRegExp from "xregexp";
import { Hint, InnerJoin, Path } from "./types";

export const parseSelectParam = (s: string, currentPath?: Path): Path[] => {
  s = s.replace(/\s/g, "");

  const foreignTables = XRegExp.matchRecursive(
    `,${s}`,
    ",[^,]*\\(",
    "\\)",
    "g",
    {
      valueNames: {
        "0": null,
        "1": "tableName",
        "2": "selectedColumns",
        "3": null,
      },
    }
  ).reduce((prev, curr, idx, matches) => {
    if (curr.name === "selectedColumns") {
      const name = matches[idx - 1].value.slice(1, -1);
      prev = { ...prev, [name]: curr.value };
    }
    return prev;
  }, {});

  const columns = s
    .replace(
      new RegExp(
        `${Object.entries(foreignTables)
          .map(([table, selectedColumns]) =>
            `${table}(${selectedColumns})`
              .replace(/\(/g, "\\(")
              .replace(/\)/g, "\\)")
          )
          .join("|")}`,
        "g"
      ),
      ""
    )
    .replace(/(,)\1+/g, ",")
    .split(",")
    .filter((c) => c.length > 0)
    .map((c) => {
      const split = c.split(":");
      const hasAlias = split.length > 1;
      return {
        innerJoins: currentPath?.innerJoins ?? [],
        hints: currentPath?.hints ?? [],
        alias:
          hasAlias || currentPath?.alias
            ? [currentPath?.alias ?? currentPath?.path, split[0]]
                .filter(Boolean)
                .join(".")
            : undefined,
        path: [currentPath?.path, split[hasAlias ? 1 : 0]]
          .filter(Boolean)
          .join("."),
      };
    });

  if (columns.find((c) => c.path.includes("*")))
    throw new Error("Wildcard selector is not supported");

  return [
    ...columns,
    ...Object.entries(foreignTables).flatMap(([table, selectedColumns]) => {
      // example for table
      // alias:organisation!contact_organisation_id_fkey!inner
      const aliasSplit = table.split(":");

      const currentAliasElem =
        aliasSplit.length > 1 ? aliasSplit[0] : undefined;

      const pathSplit = aliasSplit[aliasSplit.length - 1].split("!");
      const currentPathElem = pathSplit[0];
      const hasInnerJoin = pathSplit[pathSplit.length - 1] === "inner";
      const hintName =
        pathSplit.length === 3 || (pathSplit.length === 2 && !hasInnerJoin)
          ? pathSplit[1]
          : undefined;

      const path = [currentPath?.path, currentPathElem]
        .filter(Boolean)
        .join(".");

      const alias = [currentPath?.alias, currentAliasElem]
        .filter(Boolean)
        .join(".");

      const innerJoin: InnerJoin | undefined = hasInnerJoin
        ? { path }
        : undefined;
      const hint: Hint | undefined = hintName
        ? { path, hint: hintName }
        : undefined;

      return parseSelectParam(`${selectedColumns}`, {
        path,
        alias: alias.length > 0 ? alias : undefined,
        innerJoins:
          !innerJoin && !currentPath?.innerJoins
            ? undefined
            : [
                ...(currentPath?.innerJoins ? currentPath.innerJoins : []),
                ...(innerJoin ? [innerJoin] : []),
              ],
        hints:
          !hint && !currentPath?.hints
            ? undefined
            : [
                ...(currentPath?.hints ? currentPath.hints : []),
                ...(hint ? [hint] : []),
              ],
      });
    }),
  ];
};
