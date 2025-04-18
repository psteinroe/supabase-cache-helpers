import { getTableFromUrl } from './get-table-from-url';
import { MaybeLikePostgrestBuilder } from './like-postgrest-builder';
import { isLikeQueryBuilder } from './like-query-builder';

export const getTable = <Result>(
  query: MaybeLikePostgrestBuilder<Result>,
): string => {
  if (!isLikeQueryBuilder(query)) {
    throw new Error('Invalid PostgrestBuilder');
  }

  return getTableFromUrl(query['url'].pathname);
};
