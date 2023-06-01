import {
  OrderDefinition,
  PostgrestFilter,
} from '@supabase-cache-helpers/postgrest-filter';
import { merge as mergeAnything } from 'merge-anything';

import { findIndexOrdered } from './find-index-ordered';
import { UpsertMutatorConfig } from './types';

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
