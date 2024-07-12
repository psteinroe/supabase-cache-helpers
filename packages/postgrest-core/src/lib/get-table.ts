import type {
  PostgrestBuilder,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/cjs/types';

export const getTable = (
  query:
    | PostgrestBuilder<any>
    | PostgrestQueryBuilder<GenericSchema, GenericTable>,
): string => (query as { url: URL })['url'].pathname.split('/').pop() as string;
