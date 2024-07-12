import type { DecodedKey } from "@supabase-cache-helpers/postgrest-core";

export type DecodedSWRKey = DecodedKey & {
  isInfinite: boolean;
  key: string;
  isInfiniteKey: boolean;
};
