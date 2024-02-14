import { PostgrestError } from '@supabase/postgrest-js';
import {
  AnyPostgrestResponse,
  isPostgrestBuilder,
} from '@supabase-cache-helpers/postgrest-core';
import { UseQueryOptions as UseReactQueryOptions } from '@tanstack/react-query';

import { encode } from '../lib/key';

export function buildQueryOpts<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<AnyPostgrestResponse<Result>, PostgrestError>,
    'queryKey' | 'queryFn'
  >,
): UseReactQueryOptions<AnyPostgrestResponse<Result>, PostgrestError> {
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
