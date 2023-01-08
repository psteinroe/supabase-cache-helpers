import { PostgrestFilter } from "@supabase-cache-helpers/postgrest-filter";
import {
  isPostgrestHasMorePaginationResponse,
  isAnyPostgrestResponse,
} from "@supabase-cache-helpers/postgrest-shared";
import merge from "lodash/merge";

import { calculateNewCount } from "./calculate-new-count";
import { MutatorFn } from "./types";

export const buildUpsertMutatorFn = <Type extends Record<string, unknown>>(
  input: Type,
  primaryKeys: (keyof Type)[],
  filter: Pick<PostgrestFilter<Type>, "apply" | "hasPaths">
): MutatorFn<Type> => {
  return (currentData) => {
    // Return early if undefined or null
    if (!currentData) return currentData;

    if (isPostgrestHasMorePaginationResponse<Type>(currentData)) {
      let exists = false;
      currentData.some((page: Type[], pageIdx: number) => {
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
          exists = true;
          return true;
        }
        return false;
      });
      // Only insert if input has a value for all paths selected by the current key
      if (!exists && filter.hasPaths(input)) currentData[0].unshift(input);
      return currentData;
    }
    if (isAnyPostgrestResponse<Type>(currentData)) {
      const { data } = currentData;

      if (!Array.isArray(data)) {
        const newData = merge(data, input);
        // Check if the new data is still valid given the key
        if (!filter.apply(newData)) return { data: null };
        return {
          data: newData,
          count: calculateNewCount<Type>(currentData),
        };
      }

      const itemIdx = data.findIndex((oldItem: Type) =>
        primaryKeys.every((pk) => oldItem[pk] === input[pk])
      );

      let mode: "add" | "subtract" | undefined;
      if (itemIdx !== -1) {
        const newItem = merge(data[itemIdx], input);
        // Check if the item is still a valid member of the list
        if (filter.apply(newItem)) {
          data[itemIdx] = newItem;
        }
        // if not, remove it
        else {
          mode = "subtract";
          data.splice(itemIdx, 1);
        }
      } else if (filter.hasPaths(input)) {
        // Only insert if input has a value for all paths selected by the current key
        mode = "add";
        data.unshift(input);
      }

      return {
        data,
        count: calculateNewCount<Type>(currentData, mode),
      };
    }

    return currentData;
  };
};
