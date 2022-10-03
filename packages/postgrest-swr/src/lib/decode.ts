import { Key } from "swr";
import { INFINITE_PREFIX, KEY_PREFIX, KEY_SEPARATOR } from "./constants";
import { DecodedSWRKey } from "./types";

export const decode = (key: Key): DecodedSWRKey | null => {
  if (typeof key !== "string") return null;

  const isInfinite = key.startsWith(INFINITE_PREFIX);
  let parsedKey = key.replace(INFINITE_PREFIX, "");

  // Exit early if not a postgrest key
  const isPostgrestKey = parsedKey.startsWith(`${KEY_PREFIX}${KEY_SEPARATOR}`);
  if (!isPostgrestKey) {
    return null;
  }
  parsedKey = parsedKey.replace(`${KEY_PREFIX}${KEY_SEPARATOR}`, "");

  const [schema, table, queryKey, bodyKey, count, head] =
    parsedKey.split(KEY_SEPARATOR);

  const params = new URLSearchParams(queryKey);
  const limit = params.get("limit");
  const offset = params.get("offset");

  const countValue = count.replace("count=", "");

  return {
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
    bodyKey,
    count: countValue === "null" ? null : countValue,
    isHead: head === "head=true",
    isInfinite,
    key,
    queryKey,
    schema,
    table,
  };
};
