import merge from "lodash/merge";

import { isInfiniteCacheData } from "@supabase-cache-helpers/postgrest-core";

import { calculateNewCount } from "./lib";
import { MutatorFn } from "./types";

export const buildUpsertMutator = <Type extends object>(
  input: Type,
  primaryKeys: (keyof Type)[],
  hasPathsFilterFn: (input: Type) => boolean
): MutatorFn<Type> => {
  return (currentData) => {
    // Return early if undefined or null
    if (!currentData) return currentData;

    if (isInfiniteCacheData<Type>(currentData)) {
      let exists = false;
      currentData.some((page: Array<Type>, pageIdx: number) => {
        // Find the old item index
        const itemIdx = page.findIndex((oldItem: Type) =>
          primaryKeys.every((pk) => oldItem[pk] === input[pk])
        );

        // If item is in the current page, merge it
        if (itemIdx !== -1) {
          currentData[pageIdx][itemIdx] = merge(
            currentData[pageIdx][itemIdx],
            input
          );
          exists = true;
          return true;
        }
        return false;
      });
      // Only insert if input has a value for all paths selected by the current key
      if (!exists && hasPathsFilterFn(input)) currentData[0].unshift(input);
      return currentData;
    }

    const { data } = currentData;
    if (!Array.isArray(data)) {
      return {
        data: merge(data, input),
        count: calculateNewCount<Type>(currentData),
      };
    }
    let exists = false;
    data.some((item: Type, idx: number) => {
      if (primaryKeys.every((pk) => item[pk] === input[pk])) {
        data[idx] = merge(data[idx], input);
        exists = true;
        return true;
      }
      return false;
    });
    // Only insert if input has a value for all paths selected by the current key
    const insert = !exists && hasPathsFilterFn(input);
    if (insert) data.unshift(input);
    return {
      data,
      count:
        (insert
          ? calculateNewCount<Type>(currentData, "add")
          : calculateNewCount<Type>(currentData)) ?? null,
    };
  };
};
