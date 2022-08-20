import { isPaginationCacheData } from "@supabase-cache-helpers/postgrest-shared";

import { calculateNewCount } from "./lib";
import { MutatorFn } from "./types";

export const buildDeleteMutator = <Type>(
  input: Type,
  primaryKeys: (keyof Type)[]
): MutatorFn<Type> => {
  return (currentData) => {
    // Return early if undefined or null
    if (!currentData) return currentData;

    if (isPaginationCacheData<Type>(currentData)) {
      currentData.some((page: Array<Type>, pageIdx: number) => {
        // Find the old item index
        const itemIdx = page.findIndex((oldItem: Type) =>
          primaryKeys.every((pk) => oldItem[pk] === input[pk])
        );

        // If item is in the current page, remove it
        if (itemIdx !== -1) {
          currentData[pageIdx].splice(itemIdx, 1);
          return true;
        }
        return false;
      });
      return currentData;
    } else {
      const { data } = currentData;
      if (!Array.isArray(data)) {
        return currentData;
      }

      // .filter every primary key
      const newData = data.filter((i) =>
        primaryKeys.some((pk) => i[pk] !== input[pk])
      );
      // If an item was removed, reduce count by one
      const newCount = calculateNewCount<Type>(
        currentData,
        newData.length !== data.length ? "subtract" : undefined
      );
      return {
        data: newData,
        count: newCount ?? undefined,
      };
    }
  };
};
