import { get as defaultGet } from './get';
import { ifDateGetTime } from './if-date-get-time';
import type { OrderDefinition } from './query-types';

export const buildSortedComparator = <Type extends Record<string, unknown>>(
  orderBy: OrderDefinition[],
) => {
  return (a: Type, b: Type) => {
    for (const { column, ascending, nullsFirst, foreignTable } of orderBy) {
      const aValue = ifDateGetTime(
        defaultGet(
          a,
          `${foreignTable ? `${foreignTable}.` : ''}${column}`,
          null,
        ),
      );

      const bValue = ifDateGetTime(
        defaultGet(
          b,
          `${foreignTable ? `${foreignTable}.` : ''}${column}`,
          null,
        ),
      );

      // go to next if value is equals
      if (aValue === bValue) continue;

      // nullsFirst / nullsLast
      if (aValue === null || aValue === undefined) {
        return nullsFirst ? -1 : 1;
      }

      if (bValue === null || bValue === undefined) {
        return nullsFirst ? 1 : -1;
      }

      // otherwise, if we're ascending, lowest sorts first
      if (ascending) {
        return aValue < bValue ? -1 : 1;
      }

      // if descending, highest sorts first
      return aValue < bValue ? 1 : -1;
    }

    return 0;
  };
};
