import type {
  GenericSchema,
  GenericTable,
} from '@supabase-cache-helpers/postgrest-core';
import {
  PostgrestQueryBuilder,
  type PostgrestClientOptions,
} from '@supabase/postgrest-js';

export function cloneQueryBuilder<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  RelationName extends string,
  Relationships,
>(qb: PostgrestQueryBuilder<O, S, T, RelationName, Relationships>) {
  // PostgREST mutates the URL and headers; each mutation needs its own request.
  return new PostgrestQueryBuilder<O, S, T, RelationName, Relationships>(
    new URL(qb.url),
    { headers: qb.headers, schema: qb.schema, fetch: qb.fetch },
  );
}
