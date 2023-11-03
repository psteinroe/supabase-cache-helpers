import { RevalidateRelations } from './revalidate-relations';
import { RevalidateTables } from './revalidate-tables';
import {
  AnyPostgrestResponse,
  PostgrestHasMorePaginationResponse,
} from '../lib/response-types';

export type RevalidateOpts<Type extends Record<string, unknown>> = {
  revalidateTables?: RevalidateTables;
  revalidateRelations?: RevalidateRelations<Type>;
};

export type MutatorFn<Type> = (
  currentData:
    | AnyPostgrestResponse<Type>
    | PostgrestHasMorePaginationResponse<Type>
    | unknown,
) =>
  | AnyPostgrestResponse<Type>
  | PostgrestHasMorePaginationResponse<Type>
  | unknown;

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
