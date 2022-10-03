import { GenericTable } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestQueryBuilder } from "@supabase/postgrest-js";

export const getTable = (query: PostgrestQueryBuilder<GenericTable>): string =>
  query.url.pathname.split("/").pop() as string;
