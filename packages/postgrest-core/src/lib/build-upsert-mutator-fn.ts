import { merge as mergeAnything } from 'merge-anything';

import { PostgrestFilter } from '../postgrest-filter';
import {
  isPostgrestHasMorePaginationCacheData,
  isPostgrestPaginationCacheData,
} from './cache-data-types';
import { findIndexOrdered } from './find-index-ordered';
import { MutatorFn, UpsertMutatorConfig } from './mutator-types';
import { OrderDefinition } from './query-types';
import { isAnyPostgrestResponse } from './response-types';
import {
  toHasMorePaginationCacheData,
  toPaginationCacheData,
} from './transformers';

export const upsert = <Type extends Record<string, unknown>>(
  input: Type,
  currentData: Type[],
  primaryKeys: (keyof Type)[],
  filter: Pick<PostgrestFilter<Type>, 'apply'>,
  query?: { orderBy?: OrderDefinition[] },
  config?: UpsertMutatorConfig<Type>
) => {
  const mergeFn = config?.merge ? config.merge : mergeAnything;

  // find item
  const itemIdx = currentData.findIndex((oldItem) =>
    primaryKeys.every((pk) => oldItem[pk] === input[pk])
  );

  let newItem = input;
  let newItemIdx = itemIdx;

  if (itemIdx !== -1) {
    // if exists, merge and remove
    newItem = mergeFn(currentData[itemIdx], input) as Type;
    currentData.splice(itemIdx, 1);
  }

  if (
    query?.orderBy &&
    Array.isArray(query.orderBy) &&
    query.orderBy.length > 0
  ) {
    // if ordered, find new idx
    newItemIdx = findIndexOrdered(newItem, currentData, query.orderBy);
  }

  if (newItemIdx === -1) {
    // default to prepend
    newItemIdx = 0;
  }

  // check that new item is still a valid member of the list and has all required paths
  if (filter.apply(newItem)) {
    currentData.splice(newItemIdx, 0, newItem);
  }

  return currentData;
};

export const buildUpsertMutatorFn = <Type extends Record<string, unknown>>(
  input: Type,
  primaryKeys: (keyof Type)[],
  filter: Pick<PostgrestFilter<Type>, 'apply' | 'hasPaths'>,
  query: { orderBy: OrderDefinition[] | undefined; limit: number | undefined },
  config?: UpsertMutatorConfig<Type>
): MutatorFn<Type> => {
  const merge = config?.merge ?? mergeAnything;
  const limit = query.limit ?? 1000;
  return (currentData) => {
    // Return early if undefined or null
    if (!currentData) return currentData;

    if (isPostgrestHasMorePaginationCacheData<Type>(currentData)) {
      return toHasMorePaginationCacheData(
        upsert<Type>(
          input,
          currentData.flatMap((p) => p.data),
          primaryKeys,
          filter,
          query,
          config
        ),
        currentData,
        limit
      );
    } else if (isPostgrestPaginationCacheData<Type>(currentData)) {
      return toPaginationCacheData(
        upsert<Type>(
          input,
          currentData.flat(),
          primaryKeys,
          filter,
          query,
          config
        ),
        limit
      );
    } else if (isAnyPostgrestResponse<Type>(currentData)) {
      const { data } = currentData;

      if (!Array.isArray(data)) {
        if (data === null) {
          return { data, count: currentData.count };
        }
        const newData = merge(data, input);
        return {
          // Check if the new data is still valid given the key
          data: filter.apply(newData) ? newData : null,
          count: currentData.count,
        };
      }

      const newData = upsert<Type>(
        input,
        data,
        primaryKeys,
        filter,
        query,
        config
      );

      return {
        data: newData,
        count: newData.length,
      };
    }
    return currentData;
  };
};
