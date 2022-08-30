import { Options as UseMutationOptions } from "use-mutation";
import { MutatorOptions as SWRMutatorOptions } from "swr/dist/types";
import { PostgrestMutatorOpts } from "@supabase-cache-helpers/postgrest-shared";
import { PostgrestError } from "@supabase/postgrest-js";
import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";

export type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

export type GenericFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export type Operation =
  | "InsertOne"
  | "InsertMany"
  | "UpdateOne"
  | "UpsertOne"
  | "UpsertMany"
  | "DeleteOne";

export type GetInputType<
  T extends GenericTable,
  O extends Operation
> = O extends "DeleteOne"
  ? Partial<T["Row"]> // TODO: Can we pick the primary keys somehow?
  : O extends "InsertOne" | "UpsertOne"
  ? T["Insert"]
  : O extends "InsertMany" | "UpsertMany"
  ? T["Insert"][]
  : O extends "UpdateOne"
  ? T["Update"]
  : never;

export type PostgrestSWRMutatorOpts<
  T extends GenericTable,
  O extends Operation,
  Q extends string = "*",
  R = GetResult<T["Row"], Q extends "*" ? "*" : Q>
> = PostgrestMutatorOpts<T["Row"]> &
  UseMutationOptions<GetInputType<T, O>, R, PostgrestError> &
  SWRMutatorOptions;
