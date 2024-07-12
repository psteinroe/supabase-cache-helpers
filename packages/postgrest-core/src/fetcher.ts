import { isPostgrestBuilder } from './lib/is-postgrest-builder';
import type { AnyPostgrestResponse } from './lib/response-types';

export const fetcher = async <Result>(
  q: PromiseLike<AnyPostgrestResponse<Result>>,
) => {
  if (isPostgrestBuilder(q)) {
    q = q.throwOnError();
  }
  return await q;
};
