import { OrderDefinition } from '../../utils/query-types';
import { binarySearch } from './binary-search';
import { buildSortedComparator } from './sorted-comparator';

export const findIndexOrdered = <Type extends Record<string, unknown>>(
  input: Type,
  currentData: Type[],
  orderBy: OrderDefinition[]
): number => binarySearch(currentData, input, buildSortedComparator(orderBy));
