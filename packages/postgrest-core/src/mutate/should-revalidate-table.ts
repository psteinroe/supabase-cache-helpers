import { DecodedKey } from './types';

export type RevalidateTableOpt = { schema?: string; table: string };

export type RevalidateTables = RevalidateTableOpt[];

export type RevalidateTablesProps = {
  decodedKey: Pick<DecodedKey, 'schema' | 'table'>;
};

export const shouldRevalidateTable = (
  tables: RevalidateTables,
  { decodedKey: { schema, table } }: RevalidateTablesProps,
): boolean =>
  Boolean(
    tables.find((t) => (!t.schema || t.schema === schema) && t.table === table),
  );
