import { decode, usePostgrestFilterCache } from '../lib';
import type {
  RevalidateOpts,
  UpsertItemCache,
} from '@supabase-cache-helpers/postgrest-core';
import { useQueryClient } from '@tanstack/vue-query';

export function getRevalidationOptions<Type extends Record<string, unknown>>(
  opts: RevalidateOpts<Type>,
) {
  // A mutation only returns the new foreign key. Revalidate the configured
  // relation table so previously cached parents lose moved/deleted children too.
  return {
    revalidateRelations: undefined,
    revalidateTables: [
      ...(opts.revalidateTables ?? []),
      ...(opts.revalidateRelations ?? []).map(({ schema, relation }) => ({
        schema,
        table: relation,
      })),
    ],
  };
}

export function useMutationCache<Type extends Record<string, unknown>>() {
  const client = useQueryClient();
  const getPostgrestFilter = usePostgrestFilterCache<Type>();

  return (): UpsertItemCache<readonly unknown[], Type> => ({
    cacheKeys: client
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey),
    getPostgrestFilter,
    decode,
    revalidate: (key) =>
      client.invalidateQueries({ queryKey: key, exact: true }),
    mutate: (key, fn) => {
      const decoded = decode(key);
      const current = client.getQueryData<{ data: unknown }>(key);
      // A local row cannot establish page boundaries, totals or single-row
      // membership. Keep those responses intact until the server refetches.
      if (
        decoded &&
        (decoded.limit !== undefined ||
          decoded.offset !== undefined ||
          decoded.count !== null ||
          !Array.isArray(current?.data))
      ) {
        return client.invalidateQueries({ queryKey: key, exact: true });
      }
      client.setQueryData(key, fn);
    },
  });
}
