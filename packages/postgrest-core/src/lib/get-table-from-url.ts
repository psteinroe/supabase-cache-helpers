/**
 * Parses a url and returns the table name the url is interacting with.
 *
 * For mutations, the .split("?") goes unused.
 *
 * @param url The url we are pulling the table name from
 * @returns Table name
 */
export const getTableFromUrl = (url: string): string =>
  url.split("/").pop()?.split("?").shift() as string;
