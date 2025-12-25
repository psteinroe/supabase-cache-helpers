import type { GenericSchema } from './postgrest-types';
import type {
  PostgrestClientOptions,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';

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
