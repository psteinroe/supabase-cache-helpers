import { DecodedKey, MutatorFn } from './types';
import { PostgrestFilter } from '../postgrest-filter';
import { PostgrestQueryParserOptions } from '../postgrest-query-parser';

export type RevalidateRelationOpt<Type> = {
  schema?: string;
  relation: string;
  relationIdColumn: string;
  fKeyColumn: keyof Type;
};

export type RevalidateRelations<Type extends Record<string, unknown>> =
  RevalidateRelationOpt<Type>[];

export type RevalidateRelationsProps<
  KeyType,
  Type extends Record<string, unknown>,
> = {
  key: KeyType;
  input: Type;
  decodedKey: Pick<DecodedKey, 'schema' | 'table' | 'queryKey'>;
  getPostgrestFilter: (
    query: string,
    opts?: PostgrestQueryParserOptions,
  ) => Pick<PostgrestFilter<Type>, 'applyFilters'>;
  /**
   * The mutation function from the cache library
   */
  mutate: (key: KeyType, fn?: MutatorFn<Type>) => Promise<void> | void;
};

export const revalidateRelations = async <
  KeyType,
  Type extends Record<string, unknown>,
>(
  relations: RevalidateRelations<Type>,
  {
    key,
    input,
    getPostgrestFilter,
    mutate,
    decodedKey: { schema, table, queryKey },
  }: RevalidateRelationsProps<KeyType, Type>,
) => {
  const mutations = [];
  for (const r of relations ?? []) {
    if (
      (!r.schema || r.schema === schema) &&
      r.relation === table &&
      getPostgrestFilter(queryKey, {
        exclusivePaths: [r.relationIdColumn],
      }).applyFilters({
        [r.relationIdColumn]: input[r.fKeyColumn],
      })
    ) {
      mutations.push(mutate(key));
    }
  }

  return Promise.all(mutations);
};
