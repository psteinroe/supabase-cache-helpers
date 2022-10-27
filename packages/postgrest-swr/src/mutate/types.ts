import { GetResult } from "@supabase/postgrest-js/dist/module/select-query-parser";
import { PostgrestError } from "@supabase/supabase-js";
import { PostgrestSWRMutatorOpts } from "../lib";
import { Options as UseMutationOptions } from "use-mutation";
import {
  GenericSchema,
  GenericTable,
} from "@supabase/postgrest-js/dist/module/types";

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

export type UsePostgrestSWRMutationOpts<
  S extends GenericSchema,
  T extends GenericTable,
  O extends Operation,
  Q extends string = "*",
  R = GetResult<S, T["Row"], Q extends "*" ? "*" : Q>
> = PostgrestSWRMutatorOpts<T> &
  UseMutationOptions<GetInputType<T, O>, R, PostgrestError>;
