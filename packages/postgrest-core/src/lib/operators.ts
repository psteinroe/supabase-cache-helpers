import { deepEqual } from "fast-equals";

import type { FilterOperator, OperatorFn } from "./query-types";

/**
 * Builds a regex for a (i)like postgres operator by replacing the "%" with a regex wildcard ".*"
 * @param search The search value
 * @returns A RegExp representing the (i)like operation
 */
const buildLikeRegex = (search: string) =>
  new RegExp(`^${search.replace(/%/g, ".*")}$`);

/**
 * A poor humans attempt to implement postgres text search in javascript.
 * Converts the search string into a regex before testing it against all tokens.
 */
const textSearch: OperatorFn = (c, v) => {
  const regExp = `^${v
    .split("&")
    .map((v: string) => v.trim().toLowerCase())
    .join("|")
    .replace(/:\*/g, ".*")}$`;
  const tokens = c
    .match(/'(.*?)'/g)
    .map((t: string) => t.replace(/'/g, "").toLowerCase());
  return tokens.some((t: string) => new RegExp(regExp).test(t));
};

/**
 * Date instances do not work with equality operators, which is why their times are compared instead.
 *
 * ref: https://stackoverflow.com/questions/492994/compare-two-dates-with-javascript
 * @param v The input value
 * @returns If the input value is an instanceof Date, return v.getTime(), else the input value
 */
const ifDateGetTime = (v: any) => (v instanceof Date ? v.getTime() : v);

const enclose = (v: string, char: string) => {
  if (!v.startsWith(char)) v = `${char}${v}`;
  if (!v.endsWith(char)) v = `${v}${char}`;
  return v;
};

/**
 * An object containing all FilterOperator implementations
 */
export const OPERATOR_MAP: { [Key in FilterOperator]?: OperatorFn } = {
  eq: (c, v) => ifDateGetTime(c) === ifDateGetTime(v),
  neq: (c, v) => ifDateGetTime(c) !== ifDateGetTime(v),
  gt: (c, v) => c > v,
  gte: (c, v) => c >= v,
  lt: (c, v) => c < v,
  lte: (c, v) => c <= v,
  like: (c, v) => buildLikeRegex(v).test(c.toString()),
  ilike: (c, v) =>
    buildLikeRegex(v.toLowerCase()).test(c.toString().toLowerCase()),
  is: (c, v) => c === v,
  in: (c, v) => {
    const parsedValue = v.slice(1, -1).split(",");
    return parsedValue.some((i: string) => i === c);
  },
  // contains
  cs: (c, v) => {
    if (!Array.isArray(c)) return false;
    if (!Array.isArray(v)) v = v.slice(1, -1).split(",");
    return v.every((i: string) => c.some((colVal) => deepEqual(colVal, i)));
  },
  // containedBy
  cd: (c, v) => {
    if (!Array.isArray(c)) return false;
    if (!Array.isArray(v)) v = v.slice(1, -1).split(",");
    return c.every((i: string) =>
      v.some((cmpVal: any) => deepEqual(cmpVal, i)),
    );
  },
  fts: textSearch,
  plfts: (c, v) =>
    buildLikeRegex(enclose(v.toLowerCase(), "%")).test(
      c.toString().toLowerCase(),
    ),
};
