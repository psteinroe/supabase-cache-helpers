import { parseOrderBy as core } from '@supabase-cache-helpers/postgrest-core';

export function parseOrderBy(
  searchParams: URLSearchParams,
  {
    orderByPath,
    uqOrderByPath,
  }: { orderByPath: string; uqOrderByPath?: string },
) {
  const orderByDef = core(searchParams);
  const orderBy = orderByDef.find((o) => o.column === orderByPath);

  if (!orderBy) {
    throw new Error(`No ordering key found for path ${orderByPath}`);
  }

  const uqOrderBy = uqOrderByPath
    ? orderByDef.find((o) => o.column === uqOrderByPath)
    : null;

  return {
    orderBy,
    uqOrderBy,
  };
}
