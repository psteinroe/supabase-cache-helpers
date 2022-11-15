import { PostgrestParser } from "@supabase-cache-helpers/postgrest-filter";
import { KEY_PREFIX, KEY_SEPARATOR } from "./constants";
import { DEFAULT_SCHEMA_NAME } from "@supabase-cache-helpers/postgrest-shared";

export { DEFAULT_SCHEMA_NAME };

export const encode = <Result>(parser: PostgrestParser<Result>) => {
  return [
    KEY_PREFIX,
    parser.schema ?? DEFAULT_SCHEMA_NAME,
    parser.table,
    parser.queryKey,
    parser.bodyKey ?? "null",
    `count=${parser.count}`,
    `head=${parser.isHead}`,
  ].join(KEY_SEPARATOR);
};
