import {
  OrderDefinition,
  PostgrestFilter,
} from "@supabase-cache-helpers/postgrest-filter";
import { PostgrestHasMorePaginationCacheData } from "@supabase-cache-helpers/postgrest-shared";
import { UpsertMutatorConfig } from "./types";
import { upsert } from "./upsert";

export const upsertPaginatedHasMore = <Type extends Record<string, unknown>>(
  input: Type,
  currentData: PostgrestHasMorePaginationCacheData<Type>,
  primaryKeys: (keyof Type)[],
  filter: Pick<PostgrestFilter<Type>, "apply">,
  query?: {
    orderBy?: OrderDefinition[];
    limit?: number;
  },
  config?: UpsertMutatorConfig<Type>
) => {
  // return array in chunks
  const pageSize = query?.limit ?? 1000;
  const hasMoreCache = currentData.map((p) => p.hasMore);
  return upsert(
    input,
    currentData.flatMap((p) => p.data),
    primaryKeys,
    filter,
    query,
    config
  ).reduce<PostgrestHasMorePaginationCacheData<Type>>(
    (resultArray, item, index) => {
      // default limit is 1000
      // ref: https://github.com/supabase/supabase/discussions/3765#discussioncomment-1581021
      const chunkIndex = Math.floor(index / pageSize);

      if (!resultArray[chunkIndex]) {
        let hasMore = hasMoreCache[chunkIndex];
        if (!hasMore) {
          // if new page, set to hasMore of last page
          hasMore = hasMoreCache[hasMoreCache.length - 1];
        }
        if (chunkIndex > 0) {
          // if not first page, set prev has more to true
          resultArray[chunkIndex - 1].hasMore = true;
        }
        resultArray[chunkIndex] = {
          data: [],
          hasMore:
            hasMoreCache[chunkIndex] ?? hasMoreCache[hasMoreCache.length - 1],
        }; // start a new chunk
      }

      resultArray[chunkIndex].data.push(item);

      return resultArray;
    },
    []
  );
};
