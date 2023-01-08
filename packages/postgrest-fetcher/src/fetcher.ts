import {
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestBuilder,
} from "@supabase/postgrest-js";

type AnyPostgrestResponse<Result> =
  | PostgrestSingleResponse<Result>
  | PostgrestMaybeSingleResponse<Result>
  | PostgrestResponse<Result>;

const isPostgrestBuilder = <Result>(
  q: PromiseLike<AnyPostgrestResponse<Result>>
): q is PostgrestBuilder<Result> => {
  return typeof (q as PostgrestBuilder<Result>).throwOnError === "function";
};

export const fetcher = async <Result>(
  q: PromiseLike<AnyPostgrestResponse<Result>>
) => {
  if (isPostgrestBuilder(q)) {
    q = q.throwOnError();
  }
  return await q;
};
