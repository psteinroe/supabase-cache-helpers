import { DecodedKey, MutatorFn } from './types';

export type RevalidateTableOpt = { schema?: string; table: string };

export type RevalidateTables = RevalidateTableOpt[];

export type RevalidateTablesProps<
  KeyType,
  Type extends Record<string, unknown>,
> = {
  key: KeyType;
  decodedKey: Pick<DecodedKey, 'schema' | 'table'>;
  /**
   * The mutation function from the cache library
   */
  mutate: (key: KeyType, fn?: MutatorFn<Type>) => Promise<void> | void;
};

export const revalidateTables = async <
  KeyType,
  Type extends Record<string, unknown>,
>(
  tables: RevalidateTables,
  {
    key,
    mutate,
    decodedKey: { schema, table },
  }: RevalidateTablesProps<KeyType, Type>,
) => {
  const mutations = [];
  if (
    (tables ?? []).find(
      (t) => (!t.schema || t.schema === schema) && t.table === table,
    )
  ) {
    mutations.push(mutate(key));
  }

  return Promise.all(mutations);
};
