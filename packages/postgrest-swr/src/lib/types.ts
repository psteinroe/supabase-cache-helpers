import { MutatorOptions as SWRMutatorOptions } from "swr";
import {
  PostgrestMutatorOpts,
  DecodedKey,
} from "@supabase-cache-helpers/postgrest-shared";
import { GenericTable } from "@supabase/postgrest-js/dist/module/types";

export type PostgrestSWRMutatorOpts<T extends GenericTable> =
  PostgrestMutatorOpts<T["Row"]> & SWRMutatorOptions;

export type DecodedSWRKey = DecodedKey & { isInfinite: boolean; key: string };
