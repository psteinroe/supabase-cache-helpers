import { getTableFromUrl } from './get-table-from-url';
import {
  MaybeLikePostgrestBuilder,
  isLikePostgrestBuilder,
} from './like-postgrest-builder';

export const getTable = <Result>(
  query: MaybeLikePostgrestBuilder<Result>,
): string => {
  if (!isLikePostgrestBuilder(query)) {
    throw new Error('Invalid PostgrestBuilder');
  }

  return getTableFromUrl(query['url'].pathname);
};
