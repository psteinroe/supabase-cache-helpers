import { useMemo, useState } from "react";
import { SWRInfiniteResponse } from "swr/infinite";
import { PostgrestError, PostgrestResponse } from "@supabase/postgrest-js";
import { SWRResponse } from "swr";

export type UseCountedPaginationArgs<Result extends Record<string, unknown>> = {
  pageSize: number;
} & {
  dataQuery: SWRInfiniteResponse<Result[], PostgrestError>;
  countQuery: SWRResponse<Result[], PostgrestError> &
    Pick<PostgrestResponse<Result[]>, "count">;
};

export type UseCountedPaginationResponse<Data> = Pick<
  SWRInfiniteResponse<Data, PostgrestError>,
  "isValidating" | "error"
> & {
  pages: SWRInfiniteResponse<Data[], PostgrestError>["data"];
  pageCount: null | number;
  pageIndex: number;
  setPage: (idx: number) => void;
  currentPage: null | Data[];
  nextPage: null | (() => void);
  previousPage: null | (() => void);
};

export const useCountedPagination = <Result extends Record<string, unknown>>({
  pageSize,
  countQuery,
  dataQuery,
}: UseCountedPaginationArgs<Result>): UseCountedPaginationResponse<Result> => {
  const {
    count,
    error: countError,
    isValidating: isValidatingCount,
  } = countQuery;
  const {
    data,
    error: dataError,
    isValidating: isValidatingData,
    setSize,
    size,
  } = dataQuery;

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const pageCount = useMemo(() => {
    if (!count || !pageSize) return null;
    return Math.ceil(count / pageSize);
  }, [count, pageSize]);

  return {
    pages: data,
    pageCount,
    setPage: async (idx) => {
      if (idx >= size) {
        await setSize((size) => size + 1);
      }
      setCurrentPageIndex(idx);
    },
    pageIndex: currentPageIndex,
    currentPage: data ? data[currentPageIndex] ?? [] : [],
    nextPage:
      pageCount && currentPageIndex < pageCount - 1
        ? async () => {
            if (currentPageIndex === size - 1) {
              await setSize((size) => size + 1);
            }
            setCurrentPageIndex((page) => page + 1);
          }
        : null,
    previousPage:
      currentPageIndex > 0
        ? () => setCurrentPageIndex((current) => current - 1)
        : null,
    isValidating: isValidatingCount || isValidatingData,
    error: countError ?? dataError,
  };
};
