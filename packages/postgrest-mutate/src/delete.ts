import { isInfiniteCacheData } from "@supabase-cache-helpers/postgrest-core";

import { calculateNewCount } from "./lib";
import { MutatorFn } from "./types";

export const buildDeleteMutator = <Type>(
  input: Type,
  primaryKeys: (keyof Type)[]
): MutatorFn<Type> => {
  return (currentData) => {
    if (isInfiniteCacheData<Type>(currentData)) {
      // Can only be infinite response: undefined or 2d array
      if (!Array.isArray(currentData)) {
        return currentData;
      }
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
      const newCount = calculateNewCount<Type>(currentData, "subtract");
      if (!Array.isArray(data)) {
        return { data, count: newCount ?? null };
      }

      // .filter every primary key
      return {
        data: (data as Type[]).filter((i) =>
          primaryKeys.every((pk) => i[pk] !== input[pk])
        ),
        count: newCount ?? null,
      };
    }
  };
};
