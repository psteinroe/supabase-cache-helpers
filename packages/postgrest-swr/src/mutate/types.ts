import { Options as UseMutationOptions } from "use-mutation";
import { MutatorOptions as SWRMutatorOptions } from "swr/dist/types";
import { PostgrestMutatorOpts } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestError } from "@supabase/supabase-js";

export type PostgrestSWRMutatorOpts<InputType, Type> =
  PostgrestMutatorOpts<Type> &
    UseMutationOptions<InputType, Type, PostgrestError> &
    SWRMutatorOptions;
