import { GenericSchema } from './lib/postgrest-types';
import type { Path } from './lib/query-types';
import {
  offsetPaginationFetcher,
  rpcOffsetPaginationFetcher,
} from './offset-pagination-fetcher';
import { PostgrestParser } from './postgrest-parser';
import type {
  PostgrestClientOptions,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';

/**
 * Check if any path has an inner join declaration.
 * Inner joins use !inner in their declaration, e.g., "organization!inner(name)"
 *
 * @param paths - Array of Path objects from PostgrestParser
 * @returns true if any path contains an inner join
 */
export const hasInnerJoin = (paths: Path[]): boolean => {
  return paths.some((path) => path.declaration.includes('!inner'));
};

/**
 * Options for the count fetcher
 */
export type CountFetcherOptions = {
  /** The count type to use (exact, planned, or estimated) */
  countType: 'exact' | 'planned' | 'estimated';
};

/**
 * Fetches the count for a query using a HEAD request.
 * Optimizes by using select('*') when there are no inner joins.
 *
 * @param query - The PostgREST query builder
 * @param options - Count fetcher options
 * @returns The count or null if unavailable
 */
export const fetchCount = async <
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  RelationName = unknown,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Options,
    Schema,
    Row,
    Result[],
    RelationName,
    Relationships
  >,
  { countType }: CountFetcherOptions,
): Promise<number | null> => {
  // Parse the query to check for inner joins
  const parser = new PostgrestParser(query);
  const needsOriginalSelect = hasInnerJoin(parser.paths);

  // Set the count header on the existing query
  const headers = query['headers'] as Headers;
  const existingPrefer = headers.get('Prefer') || '';
  const preferParts = existingPrefer.split(',').filter((p: string) => p.trim());
  preferParts.push(`count=${countType}`);
  headers.set('Prefer', preferParts.join(','));

  // Set method to HEAD for count-only query
  query['method'] = 'HEAD';

  // Optimize: If there are no inner joins, use select('*') for better performance
  // Inner joins affect the count (filtering rows), so we must preserve the original select
  if (!needsOriginalSelect) {
    const url = query['url'] as URL;
    url.searchParams.set('select', '*');
  }

  const { count } = await query.throwOnError();
  return count;
};

/**
 * Options for the paginated data fetcher
 */
export type PaginatedDataFetcherOptions = {
  /** Number of items per page */
  pageSize: number;
  /** Offset from the beginning */
  offset: number;
  /** RPC argument names for limit and offset (optional) */
  rpcArgs?: { limit: string; offset: string };
};

/**
 * Fetches paginated data for a query.
 * Supports both regular queries (using .range()) and RPC queries (using rpcArgs).
 *
 * @param query - The PostgREST query builder
 * @param options - Pagination options
 * @returns Array of results
 */
export const fetchPaginatedData = async <
  Options extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  RelationName = unknown,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Options,
    Schema,
    Row,
    Result[],
    RelationName,
    Relationships
  >,
  { pageSize, offset, rpcArgs }: PaginatedDataFetcherOptions,
): Promise<Result[]> => {
  return rpcArgs
    ? rpcOffsetPaginationFetcher(query, { limit: pageSize, offset, rpcArgs })
    : offsetPaginationFetcher(query, { limit: pageSize, offset });
};
