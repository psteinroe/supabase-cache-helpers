import { BuildQueryReturn } from './build-query';
import { transformRecursive } from './transform-recursive';

export type MutationFetcherResponse<R> = {
  // Normalized response
  normalizedData: R;
  // Result of query passed by user
  userQueryData?: R;
};

export const buildMutationFetcherResponse = <R>(
  input: R,
  { paths, userQueryPaths }: Pick<BuildQueryReturn, 'paths' | 'userQueryPaths'>
): MutationFetcherResponse<R> => ({
  normalizedData: transformRecursive<R>(paths, input, 'path'),
  userQueryData: userQueryPaths
    ? transformRecursive<R>(userQueryPaths, input, 'alias')
    : undefined,
});
