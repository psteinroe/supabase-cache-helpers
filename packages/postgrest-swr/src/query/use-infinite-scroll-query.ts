import { createPaginationHasMoreFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { PostgrestFilterBuilder, PostgrestError } from "@supabase/postgrest-js";
import { GenericSchema } from "@supabase/postgrest-js/dist/module/types";
import { cloneDeep } from "lodash";
import { useCallback, useMemo } from "react";
import { Middleware } from "swr";
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from "swr/infinite";

import { createKeyGetter, infiniteMiddleware, decode } from "../lib";

const parseData = (data: any[] | undefined) => {
  if (!Array.isArray(data)) return { data, hasMore: false };
  const newData = cloneDeep(data);
  const lastPage = newData[newData.length - 1];
  const lastEntry = lastPage[lastPage.length - 1];
  return {
    data: newData.flatMap((page: any[]) => {
      return page.filter((i) => !i?.hasMore);
    }),
    hasMore: lastEntry?.hasMore ?? false,
  };
};

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type SWRInfiniteScrollPostgrestResponse<Type> = Pick<
  SWRInfiniteResponse<Type, PostgrestError>,
  "isValidating" | "error" | "isLoading" | "mutate"
> & {
  loadMore: null | (() => void);
  data:
    | ArrayElement<
        Exclude<SWRInfiniteResponse<Type, PostgrestError>["data"], undefined>
      >
    | undefined;
};

function useInfiniteScrollQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>
>(
  query: PostgrestFilterBuilder<Schema, Table, Result> | null,
  config?: SWRInfiniteConfiguration & { pageSize?: number }
): SWRInfiniteScrollPostgrestResponse<Result[]> {
  const {
    data,
    error,
    isValidating,
    size,
    setSize,
    isLoading,
    mutate: swrMutate,
  } = useSWRInfinite(
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

  const { data: parsedData, hasMore } = useMemo(() => parseData(data), [data]);

  const mutate = useCallback(async () => {
    const res = await swrMutate();
    if (!res) return;
    return parseData(res).data;
  }, [swrMutate]);

  return {
    mutate,
    data: parsedData,
    loadMore: hasMore ? () => setSize(size + 1) : null,
    error,
    isValidating,
    isLoading,
  };
}

export { useInfiniteScrollQuery };
