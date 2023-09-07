import { PostgrestHasMorePaginationResponse } from './response-types';

export type PostgrestPaginationCacheData<Result> = Result[][];

export const isPostgrestPaginationCacheData = <Result>(
  q: unknown
): q is PostgrestPaginationCacheData<Result> => {
  if (!Array.isArray(q)) return false;
  return q.length === 0 || Array.isArray(q[0]);
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
      'boolean'
  );
};
