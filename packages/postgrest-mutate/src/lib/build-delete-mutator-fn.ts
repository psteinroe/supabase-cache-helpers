import {
  isAnyPostgrestResponse,
  isPostgrestHasMorePaginationCacheData,
  isPostgrestPaginationCacheData,
} from "@supabase-cache-helpers/postgrest-shared";

import { calculateNewCount } from "./calculate-new-count";
import { MutatorFn } from "./types";

export const buildDeleteMutatorFn = <Type>(
  input: Type,
  primaryKeys: (keyof Type)[]
): MutatorFn<Type> => {
  return (currentData) => {
    // Return early if undefined or null
    if (!currentData) return currentData;

    if (isPostgrestHasMorePaginationCacheData<Type>(currentData)) {
      currentData.some((page, pageIdx) => {
        // Find the old item index
        const itemIdx = page.data.findIndex((oldItem: Type) =>
          primaryKeys.every((pk) => oldItem[pk] === input[pk])
        );

        // If item is in the current page, remove it
        if (itemIdx !== -1) {
          currentData[pageIdx].data.splice(itemIdx, 1);
          return true;
        }
        return false;
      });
      return currentData;
    } else if (isPostgrestPaginationCacheData<Type>(currentData)) {
      currentData.some((page: Type[], pageIdx: number) => {
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
    } else if (isAnyPostgrestResponse<Type>(currentData)) {
      const { data } = currentData;
      if (!Array.isArray(data)) {
        return { data: null };
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
        count: newCount,
      };
    }
  };
};
