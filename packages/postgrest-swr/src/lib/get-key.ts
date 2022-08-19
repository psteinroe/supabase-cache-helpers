import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export const createKeyGetter = <Table extends Record<string, unknown>, Result>(
  query: PostgrestFilterBuilder<Table, Result> | null,
  pageSize: number
) => {
  if (!query) return () => null;
  return (pageIndex: number, previousPageData: Result[]) => {
    if (previousPageData && !previousPageData.length) return null;
    const cursor = pageIndex * pageSize;
    return query.range(cursor, cursor + pageSize - 1);
  };
};
