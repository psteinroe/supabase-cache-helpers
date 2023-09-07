import { PostgrestBuilder } from '@supabase/postgrest-js';

export const isPostgrestBuilder = <Result>(
  q: unknown
): q is PostgrestBuilder<Result> => {
  return typeof (q as PostgrestBuilder<Result>).throwOnError === 'function';
};
