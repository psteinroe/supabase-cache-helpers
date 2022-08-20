import merge from "lodash/merge";

import { isPaginationCacheData } from "@supabase-cache-helpers/postgrest-shared";

import { calculateNewCount } from "./lib";
import { MutatorFn } from "./types";

export const buildUpdateMutator = <Type>(
  input: Type,
  primaryKeys: (keyof Type)[]
): MutatorFn<Type> => {
  return (currentData) => {
    // Return early if undefined or null
    if (!currentData) return currentData;

    // if array, it must be infinite response
    if (isPaginationCacheData<Type>(currentData)) {
      if (!Array.isArray(currentData)) {
        return currentData;
      }
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
          return true;
        }
        return false;
      });
      return currentData;
    }

    // else { data, count }
    const { data } = currentData;
    const newCount = calculateNewCount<Type>(currentData);

    if (!Array.isArray(data)) {
      return { data: merge(data, input), count: newCount ?? null };
    }

    data.some((item: Type, idx: number) => {
      if (primaryKeys.every((pk) => item[pk] === input[pk])) {
        data[idx] = merge(data[idx], input);
        return true;
      }
      return false;
    });
    return { data, count: newCount ?? undefined };
  };
};
