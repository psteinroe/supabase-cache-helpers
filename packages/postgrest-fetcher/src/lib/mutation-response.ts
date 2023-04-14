import { transformRecursive } from '@supabase-cache-helpers/postgrest-filter';

import { LoadQueryReturn } from './load-query';

export type MutationFetcherResponse<R> = {
  // Normalized response
  normalizedData: R;
  // Result of query passed by user
  userQueryData?: R;
};

export const buildMutationFetcherResponse = <R>(
  input: R,
  { paths, userQueryPaths }: Pick<LoadQueryReturn, 'paths' | 'userQueryPaths'>
): MutationFetcherResponse<R> => ({
  normalizedData: transformRecursive<R>(paths, input, 'path'),
  userQueryData: userQueryPaths
    ? transformRecursive<R>(userQueryPaths, input, 'alias')
    : undefined,
});
