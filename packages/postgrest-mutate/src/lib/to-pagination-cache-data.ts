import { PostgrestPaginationCacheData } from "@supabase-cache-helpers/postgrest-shared";

export const toPaginationCacheData = <Type extends Record<string, unknown>>(
  a: Type[],
  chunkSize: number
) => {
  return a.reduce<PostgrestPaginationCacheData<Type>>(
    (resultArray, item, index) => {
      // default limit is 1000
      // ref: https://github.com/supabase/supabase/discussions/3765#discussioncomment-1581021
      const chunkIndex = Math.floor(index / chunkSize);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    },
    []
  );
};
