import { mutate, Operation, Cache } from "./lib";

export type UpdateItemProps<Type extends Record<string, unknown>> = Omit<
  Operation<Type, "UPDATE">,
  "type"
>;

export const updateItem = <Key, Type extends Record<string, unknown>>(
  op: UpdateItemProps<Type>,
  cache: Cache<Key, Type>
) => mutate({ type: "UPDATE", ...op }, cache);
