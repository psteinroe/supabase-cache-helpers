import { INFINITE_PREFIX, KEY_PREFIX, KEY_SEPARATOR } from "./constants";
import { PostgrestParser } from "@supabase-cache-helpers/postgrest-filter";
import {
  DEFAULT_SCHEMA_NAME,
  GenericTable,
} from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestQueryBuilder } from "@supabase/postgrest-js";

export type PostgrestSWRKey = {
  isInfinite: boolean;
  schema: string;
  table: string;
  query: string;
  body: string | null;
  count: string | null;
  isHead: boolean;
  key: string;
  limit?: number;
  offset?: number;
};

export const decode = (key: unknown): PostgrestSWRKey | null => {
  if (typeof key !== "string") return null;

  const isInfinite = key.startsWith(INFINITE_PREFIX);
  let parsedKey = key.replace(INFINITE_PREFIX, "");

  // Exit early if not a postgrest key
  const isPostgrestKey = parsedKey.startsWith(`${KEY_PREFIX}${KEY_SEPARATOR}`);
  if (!isPostgrestKey) {
    return null;
  }
  parsedKey = parsedKey.replace(`${KEY_PREFIX}${KEY_SEPARATOR}`, "");

  const [schema, table, query, body, count, head] =
    parsedKey.split(KEY_SEPARATOR);

  const params = new URLSearchParams(query);
  const limit = params.get("limit");
  const offset = params.get("offset");

  const countValue = count.replace("count=", "");

  return {
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
    body: body === "null" ? null : body,
    count: countValue === "null" ? null : countValue,
    isHead: head === "head=true",
    isInfinite,
    key,
    query,
    schema,
    table,
  };
};

export const encode = <Table extends Record<string, unknown>, Result>(
  parser: PostgrestParser<Table, Result>
) => {
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

export const getTable = (query: PostgrestQueryBuilder<GenericTable>): string =>
  query.url.pathname.split("/").pop() as string;
