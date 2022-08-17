import useSWR, { SWRConfiguration } from "swr";
import {
  PostgrestFilterBuilder,
  PostgrestError,
  PostgrestResponse,
} from "@supabase/postgrest-js";
import { SWRResponse } from "swr/dist/types";

import {
  createFetcher,
  FetcherType,
} from "@supabase-cache-helpers/postgrest-fetcher";

import { middleware } from "../lib";

function useQuery<Type>(
  query: PostgrestFilterBuilder<Type> | null,
  mode: "single",
  config?: SWRConfiguration
): SWRResponse<Type, PostgrestError>;
function useQuery<Type>(
  query: PostgrestFilterBuilder<Type> | null,
  mode: "maybeSingle",
  config?: SWRConfiguration
): SWRResponse<Type | null, PostgrestError>;
function useQuery<Type>(
  query: PostgrestFilterBuilder<Type> | null,
  mode: "multiple",
  config?: SWRConfiguration
): SWRResponse<Type[], PostgrestError> &
  Pick<PostgrestResponse<Type[]>, "count">;
function useQuery<Type>(
  query: PostgrestFilterBuilder<Type> | null,
  mode: FetcherType,
  config?: SWRConfiguration
): SWRResponse<Type | Type[], PostgrestError> &
  Partial<Pick<PostgrestResponse<Type | Type[]>, "count">> {
  const { data: res, ...rest } = useSWR(query, createFetcher<Type>(mode), {
    ...config,
    use: [...(config?.use ?? []), middleware],
  });
  if (!res) {
    return { data: res, ...rest };
  }
  const { data, count } = res;
  return { data, count, ...rest };
}

export { useQuery };
