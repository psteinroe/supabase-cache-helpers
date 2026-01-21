import {
  AnyPostgrestResponse,
  PostgrestParser,
  isPostgrestBuilder,
  type ValueType,
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

export function buildTablePrefix(schema: string, table: string) {
  return [schema, table].join(SEPARATOR);
}

/**
 * Escape glob special characters for Redis SCAN MATCH pattern.
 * Special chars: * ? [ ]
 */
function escapeGlobChars(str: string): string {
  return str.replace(/[*?[\]\\]/g, '\\$&');
}

/**
 * Build a glob pattern for matching cache keys by eq filter.
 * Pattern format: schema$table$*path=eq.value*
 */
export function buildFilterPattern(
  schema: string,
  table: string,
  filter: { path: string; value: ValueType },
): string {
  // URL-encode the value to match how it appears in queryKey
  const encodedValue = encodeURIComponent(String(filter.value));
  // Escape glob special characters in path and value to match literally
  const escapedPath = escapeGlobChars(filter.path);
  const escapedValue = escapeGlobChars(encodedValue);
  // Pattern: schema$table$*path=eq.value*
  return `${schema}${SEPARATOR}${table}${SEPARATOR}*${escapedPath}=eq.${escapedValue}*`;
}
