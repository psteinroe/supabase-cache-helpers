import { binarySearch } from './binary-search';
import type { OrderDefinition } from './query-types';
import { buildSortedComparator } from './sorted-comparator';

export const findIndexOrdered = <Type extends Record<string, unknown>>(
  input: Type,
  currentData: Type[],
  orderBy: OrderDefinition[],
): number => binarySearch(currentData, input, buildSortedComparator(orderBy));
