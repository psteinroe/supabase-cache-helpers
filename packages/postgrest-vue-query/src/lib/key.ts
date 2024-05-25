import {
  PostgrestParser,
  DecodedKey,
  isPostgrestBuilder,
} from '@supabase-cache-helpers/postgrest-core';

export const KEY_PREFIX = 'postgrest';
export const INFINITE_KEY_PREFIX = 'page';

export type DecodedVueQueryKey = DecodedKey & {
  isInfinite: boolean;
  key: string[];
};

export const encode = <Result>(key: unknown, isInfinite: boolean): string[] => {
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
  ];
};

export const decode = (key: unknown): DecodedVueQueryKey | null => {
  if (!Array.isArray(key)) return null;

  const [
    prefix,
    infinitePrefix,
    schema,
    table,
    queryKey,
    bodyKey,
    count,
    head,
    orderByKey,
  ] = key;

  // Exit early if not a postgrest key
  if (prefix !== KEY_PREFIX) return null;

  const params = new URLSearchParams(queryKey);
  const limit = params.get('limit');
  const offset = params.get('offset');

  const countValue = count.replace('count=', '');

  return {
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
    bodyKey,
    count: countValue === 'null' ? null : countValue,
    isHead: head === 'head=true',
    isInfinite: infinitePrefix === INFINITE_KEY_PREFIX,
    key,
    queryKey,
    schema,
    table,
    orderByKey,
  };
};
