import { mutate, Operation, Cache } from "./lib";

export type InsertItemProps<Type extends Record<string, unknown>> = Omit<
  Operation<Type, "INSERT">,
  "type"
>;

export const insertItem = <Key, Type extends Record<string, unknown>>(
  op: InsertItemProps<Type>,
  cache: Cache<Key, Type>
) => mutate({ type: "INSERT", ...op }, cache);
