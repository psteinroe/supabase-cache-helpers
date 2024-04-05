import { PostgrestError } from '@supabase/postgrest-js';
import {
  AnyPostgrestResponse,
  isPostgrestBuilder,
} from '@supabase-cache-helpers/postgrest-core';
import { UseQueryOptions as UseVueQueryOptions } from '@tanstack/vue-query';

import { encode } from '../lib/key';

export function buildQueryOpts<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    UseVueQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseVueQueryOptions<AnyPostgrestResponse<Result>, PostgrestError> {
  return {
    queryKey: encode<Result>(query, false),
    queryFn: async () => {
      if (isPostgrestBuilder(query)) {
        query = query.throwOnError();
      }
      return await query;
    },
    ...config,
  };
}
