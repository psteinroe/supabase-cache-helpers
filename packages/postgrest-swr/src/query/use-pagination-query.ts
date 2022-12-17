import { createPaginationHasMoreFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { PostgrestFilterBuilder, PostgrestError } from "@supabase/postgrest-js";
import { GenericSchema } from "@supabase/postgrest-js/dist/module/types";
import { cloneDeep } from "lodash";
import { useCallback, useMemo, useState } from "react";
import { Middleware } from "swr";
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from "swr/infinite";

import { createKeyGetter, decode, infiniteMiddleware } from "../lib";

const parseData = (data: any[] | undefined) => {
  if (!Array.isArray(data)) return { data, hasMore: false };
  const newData = cloneDeep(data);
  const lastPage = newData[newData.length - 1];
  const lastEntry = lastPage[lastPage.length - 1];
  return {
    data: newData.map((page: any[]) => {
      if (page[page.length - 1]?.hasMore) {
        page.pop();
      }
      return page;
    }),
    hasMore: lastEntry?.hasMore ?? false,
  };
};

export type SWRInfinitePaginationPostgrestResponse<Type> = Pick<
  SWRInfiniteResponse<Type, PostgrestError>,
  "isValidating" | "error" | "isLoading"
> & {
  pages: SWRInfiniteResponse<Type[], PostgrestError>["data"];
  currentPage: null | Type[];
  pageIndex: number;
  setPage: (idx: number) => void;
  nextPage: null | (() => void);
  previousPage: null | (() => void);
};

function usePaginationQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>
>(
  query: PostgrestFilterBuilder<Schema, Table, Result> | null,
  config?: SWRInfiniteConfiguration & { pageSize?: number }
): SWRInfinitePaginationPostgrestResponse<Result> {
  const { data, error, isValidating, size, setSize, isLoading } =
    useSWRInfinite(
      createKeyGetter(query, config?.pageSize ?? 20),
      createPaginationHasMoreFetcher<Schema, Table, Result, [string]>(
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

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { data: parsedData, hasMore } = useMemo(() => parseData(data), [data]);

  return {
    pages: parsedData,
    currentPage: parsedData ? parsedData[currentPageIndex] ?? [] : [],
    pageIndex: currentPageIndex,
    setPage: (idx) => setCurrentPageIndex(idx),
    nextPage:
      hasMore || currentPageIndex < size - 1
        ? () => {
            if (currentPageIndex === size - 1) {
              setSize((size) => size + 1);
            }
            setCurrentPageIndex((page) => page + 1);
          }
        : null,
    previousPage:
      currentPageIndex > 0
        ? () => setCurrentPageIndex((current) => current - 1)
        : null,
    error,
    isValidating,
    isLoading,
  };
}

export { usePaginationQuery };
