import type { RevalidateRelations } from './should-revalidate-relation';
import type { RevalidateTables } from './should-revalidate-table';

export type RevalidateOpts<Type extends Record<string, unknown>> = {
  revalidateTables?: RevalidateTables;
  revalidateRelations?: RevalidateRelations<Type>;
};

export type DecodedKey = {
  bodyKey: string | undefined;
  orderByKey: string | undefined;
  queryKey: string;
  count: string | null;
  schema: string | undefined;
  table: string;
  isHead: boolean | undefined;
  limit: number | undefined;
  offset: number | undefined;
};
