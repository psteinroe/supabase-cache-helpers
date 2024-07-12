import {
  type AnyPostgrestResponse,
  PostgrestParser,
  isPostgrestBuilder,
  offsetPaginationFetcher,
  offsetPaginationHasMoreFetcher,
} from '@supabase-cache-helpers/postgrest-core';
import type {
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import type { GenericSchema } from '@supabase/postgrest-js/dist/module/types';

import { encode } from '../lib';

function fetchQueryFallbackData<Result>(
  query: PromiseLike<PostgrestSingleResponse<Result>>,
): Promise<[string, PostgrestSingleResponse<Result>]>;

function fetchQueryFallbackData<Result>(
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>>,
): Promise<[string, PostgrestMaybeSingleResponse<Result>]>;

function fetchQueryFallbackData<Result>(
  query: PromiseLike<PostgrestResponse<Result>>,
): Promise<[string, PostgrestResponse<Result>]>;

async function fetchQueryFallbackData<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
): Promise<[string, AnyPostgrestResponse<Result>]> {
  if (!isPostgrestBuilder<Result>(query)) {
    throw new Error('Query is not a PostgrestBuilder');
  }

  return [
    encode(new PostgrestParser<Result>(query), false),
    await query.throwOnError(),
  ];
}

async function fetchOffsetPaginationHasMoreFallbackData<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Schema,
    Table,
    Result[],
    RelationName,
    Relationships
  >,
  pageSize: number,
): Promise<
  [
    string,
    [
      {
        data: Result[];
        hasMore: boolean;
      },
    ],
  ]
> {
  return [
    encode(new PostgrestParser<Result[]>(query.range(0, pageSize)), true),
    [
      await offsetPaginationHasMoreFetcher(query, {
        offset: 0,
        limit: pageSize,
        pageSize,
      }),
    ],
  ];
}

const fetchOffsetPaginationFallbackData = async <
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>,
  RelationName = unknown,
  Relationships = unknown,
>(
  query: PostgrestTransformBuilder<
    Schema,
    Table,
    Result[],
    RelationName,
    Relationships
  >,
  pageSize: number,
): Promise<[string, [Result[]]]> => {
  return [
    encode(new PostgrestParser<Result[]>(query.range(0, pageSize)), true),
    [
      await offsetPaginationFetcher(query, {
        offset: 0,
        limit: pageSize,
      }),
    ],
  ];
};

export {
  fetchQueryFallbackData,
  fetchOffsetPaginationHasMoreFallbackData,
  fetchOffsetPaginationFallbackData,
};
