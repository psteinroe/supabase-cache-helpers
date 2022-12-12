/* eslint react/display-name: 0 */

import {
  PostgrestFilterBuilder,
  PostgrestTransformBuilder,
} from "@supabase/postgrest-js";
import { GenericSchema } from "@supabase/postgrest-js/dist/module/types";

export const createKeyGetter = <
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
  query:
    | PostgrestFilterBuilder<Schema, Table, Result>
    | PostgrestTransformBuilder<Schema, Table, Result>
    | null,
  pageSize: number
) => {
  if (!query) return () => null;
  return (pageIndex: number, previousPageData: Result[]) => {
    if (previousPageData && !previousPageData.length) return null;
    const cursor = pageIndex * pageSize;
    return query.range(cursor, cursor + pageSize - 1);
  };
};
