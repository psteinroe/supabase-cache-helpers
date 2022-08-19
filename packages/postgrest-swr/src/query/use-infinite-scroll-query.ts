import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from "swr/infinite";
import { PostgrestFilterBuilder, PostgrestError } from "@supabase/postgrest-js";
import { Middleware } from "swr";
import { useMemo } from "react";
import cloneDeep from "lodash/clonedeep";

import { createPaginationHasMoreFetcher } from "@supabase-cache-helpers/postgrest-fetcher";

import { createKeyGetter, infiniteMiddleware, decode } from "../lib";

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type SWRInfiniteScrollPostgrestResponse<Type> = Pick<
  SWRInfiniteResponse<Type, PostgrestError>,
  "isValidating" | "error"
> & {
  loadMore: null | (() => void);
  data:
    | ArrayElement<
        Exclude<SWRInfiniteResponse<Type, PostgrestError>["data"], undefined>
      >
    | undefined;
};

function useInfiniteScrollQuery<
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>
>(
  query: PostgrestFilterBuilder<Table, Result> | null,
  config?: SWRInfiniteConfiguration & { pageSize?: number }
): SWRInfiniteScrollPostgrestResponse<Result[]> {
  const { data, error, isValidating, size, setSize } = useSWRInfinite(
    createKeyGetter(query, config?.pageSize ?? 20),
    createPaginationHasMoreFetcher<Table, Result, [string]>(
      query,
      (key: string) => {
        const decodedKey = decode(key);
        if (!decodedKey) {
          throw new Error("Not an SWRPostgrest key");
        }
        return {
          limit: decodedKey.limit,
          offset: decodedKey.offset,
        };
      },
      config?.pageSize ?? 20
    ),
    {
      ...config,
      use: [
        ...(config?.use ?? []),
        infiniteMiddleware as unknown as Middleware,
      ],
    }
  );

  const { data: parsedData, hasMore } = useMemo(() => {
    if (!Array.isArray(data)) return { data, hasMore: false };
    const newData = cloneDeep(data);
    const lastPage = newData[newData.length - 1];
    const lastEntry = lastPage[lastPage.length - 1];
    return {
      data: newData.flatMap((page: any[]) => {
        if (page[page.length - 1]?.hasMore) {
          page.pop();
        }
        return page;
      }),
      hasMore: lastEntry?.hasMore ?? false,
    };
  }, [data]);

  return {
    data: parsedData,
    loadMore: hasMore ? () => setSize(size + 1) : null,
    error,
    isValidating,
  };
}

export { useInfiniteScrollQuery };
