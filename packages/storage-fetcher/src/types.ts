import { SupabaseClient } from "@supabase/supabase-js";

export type StorageKey = [
  ReturnType<SupabaseClient["storage"]["from"]>,
  string
];

export type StoragePrivacy = "public" | "private";
