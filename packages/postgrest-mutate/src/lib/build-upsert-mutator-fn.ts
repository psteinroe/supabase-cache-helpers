import {
  OrderDefinition,
  PostgrestFilter,
} from '@supabase-cache-helpers/postgrest-filter';
import {
  isPostgrestHasMorePaginationCacheData,
  isPostgrestPaginationCacheData,
  isAnyPostgrestResponse,
} from '@supabase-cache-helpers/postgrest-shared';
import { default as lodashMerge } from 'lodash/merge';

import {
  toHasMorePaginationCacheData,
  toPaginationCacheData,
} from './transformers';
import { MutatorFn, UpsertMutatorConfig } from './types';
import { upsert } from './upsert';

export const buildUpsertMutatorFn = <Type extends Record<string, unknown>>(
  input: Type,
  primaryKeys: (keyof Type)[],
  filter: Pick<PostgrestFilter<Type>, 'apply' | 'hasPaths'>,
  query: { orderBy: OrderDefinition[] | undefined; limit: number | undefined },
  config?: UpsertMutatorConfig<Type>
): MutatorFn<Type> => {
  const merge = config?.merge ?? lodashMerge;
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
