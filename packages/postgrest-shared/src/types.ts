import {
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
  PostgrestBuilder,
} from "@supabase/postgrest-js";

// Convencience type to not bloat up implementation
export type AnyPostgrestResponse<Result> =
  | PostgrestSingleResponse<Result>
  | PostgrestMaybeSingleResponse<Result>
  | PostgrestResponse<Result>;

export const isAnyPostgrestResponse = <Result>(
  q: unknown
): q is AnyPostgrestResponse<Result> => {
  if (!q) return false;
  return (
    typeof (q as AnyPostgrestResponse<Result>).status === "number" &&
    typeof (q as AnyPostgrestResponse<Result>).statusText === "string"
  );
};

export type PostgrestPaginationResponse<Result> = Result[];

export const isPostgrestPaginationResponse = <Result>(
  q: unknown
): q is PostgrestPaginationResponse<Result> => {
  return Array.isArray(q);
};

export type PostgrestPaginationCacheData<Result> = Result[][];

export const isPostgrestPaginationCacheData = <Result>(
  q: unknown
): q is PostgrestPaginationCacheData<Result> => {
  if (!Array.isArray(q)) return false;
  return q.length === 0 || Array.isArray(q[0]);
};

export type PostgrestHasMorePaginationResponse<Result> = {
  data: Result[];
  hasMore: boolean;
};

export const isPostgrestHasMorePaginationResponse = <Result>(
  q: unknown
): q is PostgrestHasMorePaginationResponse<Result> => {
  if (!q) return false;
  return (
    Array.isArray((q as PostgrestHasMorePaginationResponse<Result>).data) &&
    typeof (q as PostgrestHasMorePaginationResponse<Result>).hasMore ===
      "boolean"
  );
};

export type PostgrestHasMorePaginationCacheData<Result> =
  PostgrestHasMorePaginationResponse<Result>[];

export const isPostgrestHasMorePaginationCacheData = <Result>(
  q: unknown
): q is PostgrestHasMorePaginationCacheData<Result> => {
  if (!Array.isArray(q)) return false;
  if (q.length === 0) return true;
  const firstPage = q[0];
  return (
    Array.isArray(
      (firstPage as PostgrestHasMorePaginationResponse<Result>).data
    ) &&
    typeof (firstPage as PostgrestHasMorePaginationResponse<Result>).hasMore ===
      "boolean"
  );
};

export const isPostgrestBuilder = <Result>(
  q: PromiseLike<AnyPostgrestResponse<Result>>
): q is PostgrestBuilder<Result> => {
  return typeof (q as PostgrestBuilder<Result>).throwOnError === "function";
};
