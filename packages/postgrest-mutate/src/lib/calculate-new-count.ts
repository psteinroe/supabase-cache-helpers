import { AnyPostgrestResponse } from "@supabase-cache-helpers/postgrest-shared";

/**
 * Type-safe way of calculating the new count
 * @param data
 * @param mode
 */
export const calculateNewCount = <Type>(
  data: AnyPostgrestResponse<Type>,
  mode?: "add" | "subtract"
): number | null => {
  const { count } = data as { count: number | null };

  if (typeof count === "undefined" || count === null) return count;

  if (mode === "add") return count + 1;
  if (mode === "subtract") return count - 1;

  return count;
};
