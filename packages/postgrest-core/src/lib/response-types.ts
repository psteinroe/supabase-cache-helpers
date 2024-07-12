import type {
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/postgrest-js";

// Convencience type to not bloat up implementation
export type AnyPostgrestResponse<Result> =
  | PostgrestSingleResponse<Result>
  | PostgrestMaybeSingleResponse<Result>
  | PostgrestResponse<Result>;

export const isAnyPostgrestResponse = <Result>(
  q: unknown,
): q is AnyPostgrestResponse<Result> => {
  if (!q) return false;
  return (
    typeof (q as AnyPostgrestResponse<Result>).data === "object" ||
    Array.isArray((q as AnyPostgrestResponse<Result>).data)
  );
};

export type PostgrestPaginationResponse<Result> = Result[];

export const isPostgrestPaginationResponse = <Result>(
  q: unknown,
): q is PostgrestPaginationResponse<Result> => {
  return Array.isArray(q);
};

export type PostgrestHasMorePaginationResponse<Result> = {
  data: Result[];
  hasMore: boolean;
};

export const isPostgrestHasMorePaginationResponse = <Result>(
  q: unknown,
): q is PostgrestHasMorePaginationResponse<Result> => {
  if (!q) return false;
  return (
    Array.isArray((q as PostgrestHasMorePaginationResponse<Result>).data) &&
    typeof (q as PostgrestHasMorePaginationResponse<Result>).hasMore ===
      "boolean"
  );
};
