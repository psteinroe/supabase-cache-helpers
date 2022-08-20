import { isEqual } from "lodash";
import { FilterOperator, OperatorFn } from "./types";

const buildLikeRegex = (search: string) =>
  new RegExp(`^${search.replace(/%/g, ".*")}$`);

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

const ifDateGetTime = (v: any) => (v instanceof Date ? v.getTime() : v);

const enclose = (v: string, char: string) => {
  if (!v.startsWith(char)) v = `${char}${v}`;
  if (!v.endsWith(char)) v = `${v}${char}`;
  return v;
};

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
    return v.every((i: string) => c.some((colVal) => isEqual(colVal, i)));
  },
  // containedBy
  cd: (c, v) => {
    if (!Array.isArray(c)) return false;
    if (!Array.isArray(v)) v = v.slice(1, -1).split(",");
    return c.every((i: string) => v.some((cmpVal: any) => isEqual(cmpVal, i)));
  },
  fts: textSearch,
  plfts: (c, v) =>
    buildLikeRegex(enclose(v.toLowerCase(), "%")).test(
      c.toString().toLowerCase()
    ),
};

export const SUPPORTED_OPERATORS = ["or", ...Object.keys(OPERATOR_MAP)];
