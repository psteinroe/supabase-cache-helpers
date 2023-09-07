import { isPostgrestBuilder } from '../utils/is-postgrest-builder';
import { AnyPostgrestResponse } from '../utils/response-types';

export const fetcher = async <Result>(
  q: PromiseLike<AnyPostgrestResponse<Result>>
) => {
  if (isPostgrestBuilder(q)) {
    q = q.throwOnError();
  }
  return await q;
};
