import {
  type AnyPostgrestResponse,
  isPostgrestBuilder,
  isPostgrestTransformBuilder,
} from '@supabase-cache-helpers/postgrest-core';
import type { PostgrestError } from '@supabase/postgrest-js';
import type { UseQueryOptions as UseReactQueryOptions } from '@tanstack/react-query';

import { encode } from '../lib/key';

export function buildQueryOpts<Result, TransformedResult = Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>>,
  config?: Omit<
    UseReactQueryOptions<
      AnyPostgrestResponse<TransformedResult>,
      PostgrestError
    >,
    'queryKey' | 'queryFn'
  > & {
    transformer?: (
      data: AnyPostgrestResponse<Result>['data'],
    ) => TransformedResult;
  },
): UseReactQueryOptions<
  AnyPostgrestResponse<TransformedResult>,
  PostgrestError
> {
  return {
    queryKey: encode<Result>(query, false),
    queryFn: async ({ signal }) => {
      if (isPostgrestTransformBuilder(query)) {
        query = query.abortSignal(signal);
      }
      if (isPostgrestBuilder(query)) {
        query = query.throwOnError();
      }
      const result = await query;
      if (config?.transformer && result.error === null) {
        return {
          ...result,
          data: config.transformer(result.data),
        };
      }
      return result as AnyPostgrestResponse<TransformedResult>;
    },
    ...config,
  };
}
