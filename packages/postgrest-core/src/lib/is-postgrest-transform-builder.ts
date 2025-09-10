import type {
  PostgrestClientOptions,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import type { GenericSchema } from '@supabase/postgrest-js/dist/cjs/types';

export const isPostgrestTransformBuilder = <
  ClientOptions extends PostgrestClientOptions,
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  RelationName = unknown,
  Relationships = unknown,
>(
  q: unknown,
): q is PostgrestTransformBuilder<
  ClientOptions,
  Schema,
  Row,
  Result,
  RelationName,
  Relationships
> => {
  return (
    typeof (
      q as PostgrestTransformBuilder<
        ClientOptions,
        Schema,
        Row,
        Result,
        RelationName,
        Relationships
      >
    ).abortSignal === 'function'
  );
};
