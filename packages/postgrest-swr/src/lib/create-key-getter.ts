import {
  isPostgrestHasMorePaginationResponse,
  isPostgrestPaginationResponse,
  PostgrestHasMorePaginationResponse,
  PostgrestPaginationResponse,
} from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestTransformBuilder } from "@supabase/postgrest-js";
import { GenericSchema } from "@supabase/postgrest-js/dist/module/types";

export const createKeyGetter = <
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
  query: PostgrestTransformBuilder<Schema, Table, Result> | null,
  pageSize: number
) => {
  if (!query) return () => null;
  return (
    pageIndex: number,
    previousPageData: (
      | PostgrestHasMorePaginationResponse<Result>
      | PostgrestPaginationResponse<Result>
    )[]
  ) => {
    if (
      previousPageData &&
      ((isPostgrestHasMorePaginationResponse(previousPageData) &&
        !previousPageData.data.length) ||
        (isPostgrestPaginationResponse(previousPageData) &&
          !previousPageData.length))
    )
      return null;
    const cursor = pageIndex * pageSize;
    return query.range(cursor, cursor + pageSize - 1);
  };
};
