import type { Path } from "./query-types";

export const removeFirstPathElement = (p: Path): Path => {
  const aliasWithoutFirstElement = p.alias
    ? p.alias.split(".").slice(1).join(".")
    : undefined;
  const pathWithoutFirstEelment = p.path.split(".").slice(1).join(".");

  return {
    declaration: p.declaration.split(".").slice(1).join("."),
    path: pathWithoutFirstEelment,
    alias:
      aliasWithoutFirstElement &&
      (aliasWithoutFirstElement.split(".").length > 1 ||
        aliasWithoutFirstElement !== pathWithoutFirstEelment)
        ? aliasWithoutFirstElement
        : undefined,
  };
};
