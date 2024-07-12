import type {
  PostgrestBuilder,
  PostgrestQueryBuilder,
} from "@supabase/postgrest-js";
import type {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";

export const getTable = (
  query:
    | PostgrestBuilder<any>
    | PostgrestQueryBuilder<GenericSchema, GenericTable>,
): string => (query as { url: URL })["url"].pathname.split("/").pop() as string;
