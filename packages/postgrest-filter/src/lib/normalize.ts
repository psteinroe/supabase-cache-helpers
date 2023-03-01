import get from "lodash/get";
import set from "lodash/set";

import { parseSelectParam } from "./parse-select-param";

export const normalize = <Result>(i: unknown, q: string): Result => {
  if (!i) return i as Result;
  const paths = parseSelectParam(q);
  return paths.reduce<Result>((prev, curr) => {
    set<Result>(
      prev as Record<string, unknown>,
      curr.path,
      get(i, curr.alias ? curr.alias : curr.path)
    );
    return prev;
  }, {} as Result);
};
