import merge from "lodash/merge";

import { isPaginationCacheData } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestFilter } from "@supabase-cache-helpers/postgrest-filter";

import { calculateNewCount } from "./calculate-new-count";
import { MutatorFn } from "./types";

export const buildUpdateMutatorFn = <Type extends Record<string, unknown>>(
  input: Type,
  primaryKeys: (keyof Type)[],
  filter: Pick<PostgrestFilter<Type>, "apply">
): MutatorFn<Type> => {
  return (currentData) => {
    // Return early if undefined or null
    if (!currentData) return currentData;

    // if array, it must be infinite response
    if (isPaginationCacheData<Type>(currentData)) {
      currentData.some((page: Array<Type>, pageIdx: number) => {
        // Find the old item index
        const itemIdx = page.findIndex((oldItem: Type) =>
          primaryKeys.every((pk) => oldItem[pk] === input[pk])
        );

        // If item is in the current page, merge it
        if (itemIdx !== -1) {
          const newItem = merge(currentData[pageIdx][itemIdx], input);
          // Check if the item is still a valid member of the list
          if (filter.apply(newItem)) currentData[pageIdx][itemIdx] = newItem;
          // if not, remove it
          else (currentData as Type[][])[pageIdx].splice(itemIdx, 1);
          return true;
        }
        return false;
      });
      return currentData;
    }

    // else { data, count }
    const { data } = currentData;

    if (!Array.isArray(data)) {
      // Check if the new data is still valid given the key
      const newData = merge(data, input);
      if (!filter.apply(newData)) return { data: undefined };
      return {
        data: merge(data, input),
        count: calculateNewCount<Type>(currentData),
      };
    }

    let removed = false;
    const newData = data.reduce<Type[]>((prev, item) => {
      if (primaryKeys.every((pk) => item[pk] === input[pk])) {
        const newItem = merge(item, input);
        if (filter.apply(newItem)) return [...prev, newItem];
        else {
          removed = true;
          return prev;
        }
      }
      return [...prev, item];
    }, []);

    return {
      data: newData,
      count: calculateNewCount(currentData, removed ? "subtract" : undefined),
    };
  };
};
