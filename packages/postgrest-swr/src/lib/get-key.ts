import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export const createKeyGetter = <Type>(
  query: PostgrestFilterBuilder<Type> | null,
  pageSize: number
) => {
  if (!query) return () => null;
  return (pageIndex: number, previousPageData: Type[]) => {
    if (previousPageData && !previousPageData.length) return null;
    const cursor = pageIndex * pageSize;
    return query.range(cursor, cursor + pageSize - 1);
  };
};
