import { MutatorOptions as SWRMutatorOptions } from "swr/dist/types";
import {
  PostgrestMutatorOpts,
  GenericTable,
} from "@supabase-cache-helpers/postgrest-shared";

export type PostgrestSWRMutatorOpts<T extends GenericTable> =
  PostgrestMutatorOpts<T["Row"]> & SWRMutatorOptions;
