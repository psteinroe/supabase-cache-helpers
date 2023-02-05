import { OrderDefinition } from "@supabase-cache-helpers/postgrest-filter";
import { binarySearch } from "./binary-search";
import { buildSortedComparator } from "./sorted-comparator";

export const findIndexOrdered = <Type extends Record<string, unknown>>(
  input: Type,
  currentData: Type[],
  orderBy: OrderDefinition[]
): number => binarySearch(currentData, input, buildSortedComparator(orderBy));
