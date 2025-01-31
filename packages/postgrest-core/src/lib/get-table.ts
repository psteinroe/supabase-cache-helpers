import type {
  PostgrestBuilder,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/cjs/types';
import { getTableFromUrl } from './get-table-from-url';

export const getTable = (
  query:
    | PostgrestBuilder<any>
    | PostgrestQueryBuilder<GenericSchema, GenericTable>,
): string => getTableFromUrl((query as { url: URL })['url'].pathname);
