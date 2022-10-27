import { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";

export const getTable = (
  query: PostgrestQueryBuilder<GenericSchema, GenericTable>
): string => query.url.pathname.split("/").pop() as string;
