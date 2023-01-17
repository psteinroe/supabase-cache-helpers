import { PostgrestParser } from "@supabase-cache-helpers/postgrest-filter";

import { KEY_PREFIX, KEY_SEPARATOR } from "./constants";

export const encode = <Result>(parser: PostgrestParser<Result>) => {
  return [
    KEY_PREFIX,
    parser.schema,
    parser.table,
    parser.queryKey,
    parser.bodyKey ?? "null",
    `count=${parser.count}`,
    `head=${parser.isHead}`,
    parser.orderByKey,
  ].join(KEY_SEPARATOR);
};
