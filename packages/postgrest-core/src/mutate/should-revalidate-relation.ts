import type { PostgrestFilter } from "../postgrest-filter";
import type { PostgrestQueryParserOptions } from "../postgrest-query-parser";
import type { DecodedKey } from "./types";

export type RevalidateRelationOpt<Type> = {
  schema?: string;
  relation: string;
  relationIdColumn: string;
  fKeyColumn: keyof Type;
};

export type RevalidateRelations<Type extends Record<string, unknown>> =
  RevalidateRelationOpt<Type>[];

export type RevalidateRelationsProps<Type extends Record<string, unknown>> = {
  input: Partial<Type>;
  decodedKey: Pick<DecodedKey, "schema" | "table" | "queryKey">;
  getPostgrestFilter: (
    query: string,
    opts?: PostgrestQueryParserOptions,
  ) => Pick<PostgrestFilter<Type>, "applyFilters">;
};

export const shouldRevalidateRelation = <Type extends Record<string, unknown>>(
  relations: RevalidateRelations<Type>,
  {
    input,
    getPostgrestFilter,
    decodedKey: { schema, table, queryKey },
  }: RevalidateRelationsProps<Type>,
): boolean =>
  Boolean(
    relations.find(
      (r) =>
        (!r.schema || r.schema === schema) &&
        r.relation === table &&
        typeof input[r.fKeyColumn] !== "undefined" &&
        getPostgrestFilter(queryKey, {
          exclusivePaths: [r.relationIdColumn],
        }).applyFilters({
          [r.relationIdColumn]: input[r.fKeyColumn],
        }),
    ),
  );
