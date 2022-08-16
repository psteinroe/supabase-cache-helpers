import { PostgrestCacheData } from "@supabase-cache-helpers/postgrest-shared";

export type MutatorFn<Type> = (
  currentData: PostgrestCacheData<Type>
) => PostgrestCacheData<Type>;
