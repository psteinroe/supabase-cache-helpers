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

export function createFetcher<Table extends Record<string, unknown>, Result>(
  mode: FetcherType
): (
  query: PostgrestFilterBuilder<Table, Result>
) => Promise<PostgrestFetcherResponse<Result>> {
  return async (query: PostgrestFilterBuilder<Table, Result>) => {
    if (mode === "single") {
      const { data } = await query.throwOnError().single();
      return { data };
    }
    if (mode === "maybeSingle") {
      const { data } = await query.throwOnError().maybeSingle();
      return { data };
    }
    const { data, count } = await query.throwOnError();
    return { data, count };
  };
}
