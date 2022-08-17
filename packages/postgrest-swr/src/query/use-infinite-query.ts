import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from "swr/infinite";
import { PostgrestFilterBuilder, PostgrestError } from "@supabase/postgrest-js";
import { Middleware } from "swr";

import { createPaginationFetcher } from "@supabase-cache-helpers/postgrest-fetcher";

import { createKeyGetter, infiniteMiddleware, decode } from "../lib";

function useSWRInfinitePostgrest<Type>(
  query: PostgrestFilterBuilder<Type> | null,
  config?: SWRInfiniteConfiguration & { pageSize?: number }
): SWRInfiniteResponse<Type[], PostgrestError> {
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

export { useSWRInfinitePostgrest };
