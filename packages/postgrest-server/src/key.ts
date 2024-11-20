import {
  AnyPostgrestResponse,
  PostgrestParser,
  isPostgrestBuilder,
} from '@supabase-cache-helpers/postgrest-core';

const SEPARATOR = '$';

export function encode<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
) {
  if (!isPostgrestBuilder<Result>(query)) {
    throw new Error('Query is not a PostgrestBuilder');
  }

  const parser = new PostgrestParser<Result>(query);
  return [
    parser.schema,
    parser.table,
    parser.queryKey,
    parser.bodyKey ?? 'null',
    `count=${parser.count}`,
    `head=${parser.isHead}`,
    parser.orderByKey,
  ].join(SEPARATOR);
}
