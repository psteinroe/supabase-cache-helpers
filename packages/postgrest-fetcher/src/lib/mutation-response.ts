import { Path } from "@supabase-cache-helpers/postgrest-filter";
import get from "lodash/get";
import set from "lodash/set";

import { LoadQueryReturn } from "./load-query";

export type MutationFetcherResponse<R> = {
  // Normalized response
  normalizedData: R;
  // Result of query passed by user
  userQueryData?: R;
};

export const buildMutationFetcherResponse = <R>(
  input: R,
  { paths, userQueryPaths }: Pick<LoadQueryReturn, "paths" | "userQueryPaths">
): MutationFetcherResponse<R> => ({
  normalizedData: normalize<R>(input, paths),
  userQueryData: userQueryPaths ? extract(input, userQueryPaths) : undefined,
});

const normalize = <Result>(i: Result, paths: Path[]): Result => {
  return paths.reduce<Result>((prev, curr) => {
    set<Result>(
      prev as Record<string, unknown>,
      curr.path,
      get(i, curr.alias ? curr.alias : curr.path)
    );
    return prev;
  }, {} as Result);
};

const extract = <Result>(i: Result, paths: Path[]): Result => {
  return paths.reduce<Result>((prev, curr) => {
    const p = curr.alias ? curr.alias : curr.path;
    set<Result>(prev as Record<string, unknown>, p, get(i, p));
    return prev;
  }, {} as Result);
};
