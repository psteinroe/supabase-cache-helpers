import { INFINITE_KEY_PREFIX, KEY_PREFIX, KEY_SEPARATOR } from './constants';
import {
  PostgrestParser,
  isPostgrestBuilder,
} from '@supabase-cache-helpers/postgrest-core';

export const encode = <Result>(key: unknown, isInfinite: boolean): string => {
  if (!isPostgrestBuilder<Result>(key)) {
    throw new Error('Key is not a PostgrestBuilder');
  }

  const parser = new PostgrestParser<Result>(key);
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
