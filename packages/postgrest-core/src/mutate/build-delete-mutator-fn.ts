import {
  isPostgrestHasMorePaginationCacheData,
  isPostgrestPaginationCacheData,
} from '../lib/cache-data-types';
import { MutatorFn } from '../lib/mutator-types';
import { OrderDefinition } from '../lib/query-types';
import { isAnyPostgrestResponse } from '../lib/response-types';
import {
  toHasMorePaginationCacheData,
  toPaginationCacheData,
} from './transformers';

const deleteItem = <Type extends Record<string, unknown>>(
  input: Type,
  currentData: Type[],
  primaryKeys: (keyof Type)[]
) => {
  return currentData.filter((i) =>
    primaryKeys.some((pk) => i[pk] !== input[pk])
  );
};

export const buildDeleteMutatorFn = <Type extends Record<string, unknown>>(
  input: Type,
  primaryKeys: (keyof Type)[],
  query?: { orderBy?: OrderDefinition[]; limit?: number }
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
