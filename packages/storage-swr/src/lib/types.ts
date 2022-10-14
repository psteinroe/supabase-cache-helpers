import { SupabaseClient } from "@supabase/supabase-js";

export type StorageFileApi = ReturnType<SupabaseClient["storage"]["from"]>;
