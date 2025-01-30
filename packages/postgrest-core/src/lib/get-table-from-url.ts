/**
 * Parses a url and returns the table name the url is interacting with.
 *
 * For mutations, the .split('?') goes unused.
 *
 * @param url The url we are pulling the table name from
 * @returns Table name
 */
export const getTableFromUrl = (url: string): string => {
  // Split the url
  const split = url.toString().split("/");
  // Pop the last part of the path off and remove any params if they exist
  const table = split.pop()?.split("?").shift() as string;
  // Pop an additional position to check for rpc
  const maybeRpc = split.pop() as string;
  // Rejoin the result to include rpc otherwise just table name
  return [maybeRpc === "rpc" ? maybeRpc : null, table]
    .filter(Boolean)
    .join("/");
};
