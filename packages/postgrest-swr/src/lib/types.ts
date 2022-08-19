import { Options as UseMutationOptions } from "use-mutation";
import { MutatorOptions as SWRMutatorOptions } from "swr/dist/types";
import { PostgrestMutatorOpts } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestError } from "@supabase/supabase-js";

export type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

export type GenericFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export type PostgrestSWRMutatorOpts<
  Table extends GenericTable,
  Operation extends "Insert" | "Update" | "Delete"
> = PostgrestMutatorOpts<Table["Row"]> &
  UseMutationOptions<
    Operation extends "Insert" | "Update"
      ? Table[Operation extends "Insert" ? "Insert" : "Update"]
      : Partial<Table["Row"]>, // TODO: Can we pick the primary keys somehow?
    Table["Row"],
    PostgrestError
  > &
  SWRMutatorOptions;
