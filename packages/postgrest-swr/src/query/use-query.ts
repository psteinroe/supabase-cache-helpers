import {
  AnyPostgrestResponse,
  isPostgrestBuilder,
} from "@supabase-cache-helpers/postgrest-shared";
import {
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
} from "@supabase/postgrest-js";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";

import { middleware } from "../lib";

/**
 * Perform a postgrest query
 * @param query
 * @param config
 */
function useQuery<Result>(
  query: PromiseLike<PostgrestSingleResponse<Result>> | null,
  config?: SWRConfiguration
): Omit<
  SWRResponse<PostgrestSingleResponse<Result>["data"], PostgrestError>,
  "mutate"
> &
  Pick<SWRResponse<PostgrestSingleResponse<Result>, PostgrestError>, "mutate"> &
  Pick<PostgrestSingleResponse<Result>, "count">;
function useQuery<Result>(
  query: PromiseLike<PostgrestMaybeSingleResponse<Result>> | null,
  config?: SWRConfiguration
): Omit<
  SWRResponse<PostgrestMaybeSingleResponse<Result>["data"], PostgrestError>,
  "mutate"
> &
  Pick<
    SWRResponse<PostgrestMaybeSingleResponse<Result>, PostgrestError>,
    "mutate"
  > &
  Pick<PostgrestMaybeSingleResponse<Result>, "count">;
function useQuery<Result>(
  query: PromiseLike<PostgrestResponse<Result>> | null,
  config?: SWRConfiguration
): Omit<
  SWRResponse<PostgrestResponse<Result>["data"], PostgrestError>,
  "mutate"
> &
  Pick<SWRResponse<PostgrestResponse<Result>, PostgrestError>, "mutate"> &
  Pick<PostgrestResponse<Result>, "count">;
function useQuery<Result>(
  query: PromiseLike<AnyPostgrestResponse<Result>> | null,
  config?: SWRConfiguration
): Omit<
  SWRResponse<AnyPostgrestResponse<Result>["data"], PostgrestError>,
  "mutate"
> &
  Pick<SWRResponse<AnyPostgrestResponse<Result>, PostgrestError>, "mutate"> &
  Pick<AnyPostgrestResponse<Result>, "count"> {
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
