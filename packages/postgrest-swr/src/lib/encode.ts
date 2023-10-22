import { PostgrestParser } from '@supabase-cache-helpers/postgrest-core';

import { INFINITE_KEY_PREFIX, KEY_PREFIX, KEY_SEPARATOR } from './constants';

export const encode = <Result>(
  parser: PostgrestParser<Result>,
  isInfinite: boolean,
) => {
  return [
    KEY_PREFIX,
    isInfinite ? INFINITE_KEY_PREFIX : 'null',
    parser.schema,
    parser.table,
    parser.queryKey,
    parser.bodyKey ?? 'null',
    `count=${parser.count}`,
    `head=${parser.isHead}`,
    parser.orderByKey,
  ].join(KEY_SEPARATOR);
};
