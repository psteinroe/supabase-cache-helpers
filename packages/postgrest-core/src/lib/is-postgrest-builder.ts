import type {
  PostgrestBuilder,
  PostgrestClientOptions,
} from '@supabase/postgrest-js';

export const isPostgrestBuilder = <Result>(
  q: unknown,
): q is PostgrestBuilder<PostgrestClientOptions, Result> => {
  return (
    typeof (q as PostgrestBuilder<PostgrestClientOptions, Result>)
      .throwOnError === 'function'
  );
};
