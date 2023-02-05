import {
  isAnyPostgrestResponse,
  isPostgrestHasMorePaginationCacheData,
  isPostgrestPaginationCacheData,
} from "@supabase-cache-helpers/postgrest-shared";
import { deleteItem } from "./delete";

import { calculateNewCount } from "./calculate-new-count";
import { toHasMorePaginationCacheData } from "./to-has-more-pagination-cache-data";
import { MutatorFn } from "./types";
import { OrderDefinition } from "@supabase-cache-helpers/postgrest-filter";
import { toPaginationCacheData } from "./to-pagination-cache-data";

export const buildDeleteMutatorFn = <Type extends Record<string, unknown>>(
  input: Type,
  primaryKeys: (keyof Type)[],
  query?: { orderBy: OrderDefinition[] | undefined; limit: number | undefined }
): MutatorFn<Type> => {
  const limit = query?.limit ?? 1000;
  return (currentData) => {
    // Return early if undefined or null
    if (!currentData) return currentData;

    if (isPostgrestHasMorePaginationCacheData<Type>(currentData)) {
      return toHasMorePaginationCacheData(
        deleteItem<Type>(
          input,
          currentData.flatMap((p) => p.data),
          primaryKeys
        ),
        currentData,
        limit
      );
    } else if (isPostgrestPaginationCacheData<Type>(currentData)) {
      return toPaginationCacheData(
        deleteItem<Type>(input, currentData.flat(), primaryKeys),
        limit
      );
    } else if (isAnyPostgrestResponse<Type>(currentData)) {
      const { data } = currentData;
      if (!Array.isArray(data)) {
        return { data: null };
      }

      const newData = deleteItem(input, data, primaryKeys);

      return {
        data: newData,
        count: newData.length,
      };
    }
  };
};
