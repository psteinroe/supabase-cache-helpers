import { PostgrestHasMorePaginationCacheData } from "@supabase-cache-helpers/postgrest-shared";

export const toHasMorePaginationCacheData = <
  Type extends Record<string, unknown>
>(
  a: Type[],
  currentData: PostgrestHasMorePaginationCacheData<Type>,
  chunkSize: number
) => {
  // return array in chunks
  const hasMoreCache = currentData.map((p) => p.hasMore);
  return a.reduce<PostgrestHasMorePaginationCacheData<Type>>(
    (resultArray, item, index) => {
      // default limit is 1000
      // ref: https://github.com/supabase/supabase/discussions/3765#discussioncomment-1581021
      const chunkIndex = Math.floor(index / chunkSize);

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
