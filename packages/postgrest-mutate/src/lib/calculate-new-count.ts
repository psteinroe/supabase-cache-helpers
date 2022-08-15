import { PostgrestFetcherResponse } from "@supabase-cache-helpers/postgrest-core";

/**
 * Type-safe way of calculating the new count
 * @param data
 * @param mode
 */
export const calculateNewCount = <Type>(
  data: PostgrestFetcherResponse<Type>,
  mode?: "add" | "subtract"
): number | undefined | null => {
  const { count } = data as { count: number | undefined | null };

  if (typeof count === "undefined" || count === null) return count;

  if (mode === "add") return count + 1;
  if (mode === "subtract") return count - 1;

  return count;
};
