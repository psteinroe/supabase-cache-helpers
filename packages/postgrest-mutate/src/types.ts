import { PostgrestCacheData } from "@supabase-cache-helpers/postgrest-core";

export type MutatorFn<Type> = (
  currentData: PostgrestCacheData<Type>
) => PostgrestCacheData<Type>;
