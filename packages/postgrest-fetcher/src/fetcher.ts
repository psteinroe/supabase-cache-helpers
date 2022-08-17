import {
  PostgrestFilterBuilder,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
} from "@supabase/postgrest-js";

export type FetcherType = "single" | "maybeSingle" | "multiple";

export type PostgrestFetcherResponse<Type> =
  | Pick<PostgrestSingleResponse<Type>, "data">
  | Pick<PostgrestMaybeSingleResponse<Type>, "data">
  | Pick<PostgrestResponse<Type>, "data" | "count">;

export function createFetcher<Type>(
  mode: FetcherType
): (
  query: PostgrestFilterBuilder<Type>
) => Promise<PostgrestFetcherResponse<Type>> {
  return async (query: PostgrestFilterBuilder<Type>) => {
    if (mode === "single") {
      const { data } = await query.throwOnError(true).single();
      return { data };
    }
    if (mode === "maybeSingle") {
      const { data } = await query.throwOnError(true).maybeSingle();
      return { data };
    }
    const { data, count } = await query.throwOnError(true);
    return { data, count };
  };
}
