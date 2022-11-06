import { mutate, Operation, Cache } from "./lib";

export type UpsertItemProps<Type extends Record<string, unknown>> = Omit<
  Operation<Type>,
  "type"
>;

export const upsertItem = <Key, Type extends Record<string, unknown>>(
  op: UpsertItemProps<Type>,
  cache: Cache<Key, Type>
) => mutate({ type: "UPSERT", ...op }, cache);
