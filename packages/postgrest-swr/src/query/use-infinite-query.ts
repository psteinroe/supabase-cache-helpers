import { createPaginationFetcher } from "@supabase-cache-helpers/postgrest-fetcher";
import { PostgrestFilterBuilder, PostgrestError } from "@supabase/postgrest-js";
import { GenericSchema } from "@supabase/postgrest-js/dist/module/types";
import { Middleware } from "swr";
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from "swr/infinite";

import { createKeyGetter, infiniteMiddleware, decode } from "../lib";

function useInfiniteQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result extends Record<string, unknown>
>(
  query: PostgrestFilterBuilder<Schema, Table, Result> | null,
  config?: SWRInfiniteConfiguration & { pageSize?: number }
): SWRInfiniteResponse<Result[], PostgrestError> {
  return useSWRInfinite(
    createKeyGetter(query, config?.pageSize ?? 20),
    createPaginationFetcher(
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
}

export { useInfiniteQuery };
