import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { DEFAULT_SCHEMA_NAME } from "./constants";
import { PostgrestQuery } from "./types";

const parseURL = (url: URL) => {
  const sortedSearchParams = new URLSearchParams(
    Array.from(url.searchParams.entries()).sort((a, b) => {
      const x = `${a[0]}${a[1]}`;
      const y = `${b[0]}${b[1]}`;
      return x > y ? 1 : -1;
    })
  );
  url.search = sortedSearchParams.toString();
  const urlString = url.toString();
  const split = (
    urlString.includes("/rest/v1/")
      ? urlString.split("/rest/v1/")[1]
      : urlString
  ).split("?");
  return {
    table: split[0],
    query: split[1],
  };
};

/**
 * Ignore return settings because this does not change the cached data and only affects mutations.
 * @param headers
 */
const parseHeaders = (headers: {
  [key: string]: string;
}): { schema: string; count: string } => {
  // 'Accept-Profile': schema
  // 'Content-Profile': schema
  // 'Prefer': return=minimal|representation,count=exact|planned|estimated
  const preferHeaders = (headers["Prefer"] ?? "")
    .split(",")
    .reduce<Record<string, string>>((prev, curr) => {
      const s = curr.split("=");
      return {
        ...prev,
        [s[0]]: s[1],
      };
    }, {});
  return {
    schema:
      headers["Accept-Profile"] ??
      headers["Content-Profile"] ??
      DEFAULT_SCHEMA_NAME,
    count: preferHeaders["count"] ?? null,
  };
};

/**
 * Parse a PostgrestFilterBuilder into a PostgrestQuery.
 * Only properties that alter the cached data are parsed.
 * @param fb
 */
export const parse = <Type>(
  fb: PostgrestFilterBuilder<Type> | null
): null | PostgrestQuery => {
  if (!fb) return null;
  if (!(fb["url"] instanceof URL))
    throw new Error("fb is not an instance of PostgrestFilterBuilder");

  const url = new URL(fb["url"]);
  const headers = { ...fb["headers"] };
  const body = { ...fb["body"] };
  const method = fb["method"];

  // Append body to url params to include values in key
  if (body) {
    Object.entries(body).forEach(([name, value]) => {
      url.searchParams.append(
        name,
        typeof value === "object" ? JSON.stringify(value) : String(value)
      );
    });
  }

  // Extract table and query from url
  const { table, query } = parseURL(url);

  // Encode schema and count into headers since it affects the data
  const { count, schema } = parseHeaders(headers);

  // HEAD alters the cache data for a key, hence it must be reflected in the key
  const isHead = method === "HEAD";

  return {
    count,
    isHead,
    query,
    schema,
    table,
  };
};
