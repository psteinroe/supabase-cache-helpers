import {
  PostgrestError,
  PostgrestResponse,
  PostgrestBuilder,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
} from "@supabase/postgrest-js";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";

import { middleware } from "../lib";

export type AnyPostgrestResponse<Result> =
  | PostgrestSingleResponse<Result>
  | PostgrestMaybeSingleResponse<Result>
  | PostgrestResponse<Result>;

const isPostgrestBuilder = <Result>(
  q: PromiseLike<AnyPostgrestResponse<Result>>
): q is PostgrestBuilder<Result> => {
  return typeof (q as PostgrestBuilder<Result>).throwOnError === "function";
};

export type UseQueryReturn<Result> = Omit<
  SWRResponse<AnyPostgrestResponse<Result>["data"], PostgrestError>,
  "mutate"
> &
  Pick<SWRResponse<AnyPostgrestResponse<Result>, PostgrestError>, "mutate"> &
  Pick<AnyPostgrestResponse<Result>, "count">;

/**
 * Perform a postgrest query
 * @param query
 * @param config
 */
function useQuery<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>> | null,
  config?: SWRConfiguration
): UseQueryReturn<Result> {
  const { data, ...rest } = useSWR<
    AnyPostgrestResponse<Result>,
    PostgrestError
  >(
    query,
    async (q) => {
      if (isPostgrestBuilder(q)) {
        q = q.throwOnError();
      }
      return await q;
    },
    {
      ...config,
      use: [...(config?.use ?? []), middleware],
    }
  );

  return { data: data?.data, count: data?.count ?? null, ...rest };
}

export { useQuery };
