import { mutate, Operation, Cache } from './lib';
import { UpsertMutatorConfig } from './lib/types';

export type UpsertItemProps<Type extends Record<string, unknown>> = Omit<
  Operation<Type>,
  'type'
> &
  UpsertMutatorConfig<Type>;

export const upsertItem = <Key, Type extends Record<string, unknown>>(
  op: UpsertItemProps<Type>,
  cache: Cache<Key, Type>,
  config?: UpsertMutatorConfig<Type>
) => mutate({ type: 'UPSERT', ...op }, cache, config);
