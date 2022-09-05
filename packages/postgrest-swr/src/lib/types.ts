import { MutatorOptions as SWRMutatorOptions } from "swr/dist/types";
import { PostgrestMutatorOpts } from "@supabase-cache-helpers/postgrest-shared";

export type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

export type GenericFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export type PostgrestSWRMutatorOpts<T extends GenericTable> =
  PostgrestMutatorOpts<T["Row"]> & SWRMutatorOptions;
