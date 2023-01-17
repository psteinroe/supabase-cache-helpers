import {
  isPostgrestBuilder,
  AnyPostgrestResponse,
} from "@supabase-cache-helpers/postgrest-shared";

export const fetcher = async <Result>(
  q: PromiseLike<AnyPostgrestResponse<Result>>
) => {
  if (isPostgrestBuilder(q)) {
    q = q.throwOnError();
  }
  return await q;
};
