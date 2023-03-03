import { DecodedKey } from "@supabase-cache-helpers/postgrest-mutate";

export type DecodedSWRKey = DecodedKey & {
  isInfinite: boolean;
  key: string;
  isInfiniteKey: boolean;
};
