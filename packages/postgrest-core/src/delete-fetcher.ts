import {
  type MutationFetcherResponse,
  buildMutationFetcherResponse,
} from './fetch/build-mutation-fetcher-response';
import {
  type BuildNormalizedQueryOps,
  buildNormalizedQuery,
} from './fetch/build-normalized-query';
import type {
  PostgrestClientOptions,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import { UnstableGetResult as GetResult } from '@supabase/postgrest-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/cjs/types';

export type DeleteFetcher<T extends GenericTable, R> = (
  input: Partial<T['Row']>[],
) => Promise<MutationFetcherResponse<R>[] | null>;

export type DeleteFetcherOptions<
  O extends PostgrestClientOptions,
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
> = Parameters<PostgrestQueryBuilder<O, S, T, Re>['delete']>[0];

export const buildDeleteFetcher =
  <
    O extends PostgrestClientOptions,
    S extends GenericSchema,
    T extends GenericTable,
    RelationName,
    Re = T extends { Relationships: infer R } ? R : unknown,
    Q extends string = '*',
    R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q, O>,
  >(
    qb: PostgrestQueryBuilder<O, S, T, R>,
    primaryKeys: (keyof T['Row'])[],
    opts: BuildNormalizedQueryOps<Q> &
      DeleteFetcherOptions<O, S, T, RelationName>,
  ): DeleteFetcher<T, R> =>
  async (
    input: Partial<T['Row']>[],
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    let filterBuilder = qb.delete(opts);

    if (primaryKeys.length === 1) {
      const primaryKey = primaryKeys[0] as string;
      filterBuilder.in(
        primaryKey,
        input.map((i) => {
          const v = i[primaryKey];
          if (!v) {
            throw new Error(
              `Missing value for primary key ${primaryKey as string}`,
            );
          }
          return v;
          // TODO i wont bother with this, but maybe i can nerdsnipe somone else into it
        }) as any[],
      );
    } else {
      filterBuilder = filterBuilder.or(
        input
          .map(
            (i) =>
              `and(${primaryKeys.map((c) => {
                const v = i[c];
                if (!v) {
                  throw new Error(
                    `Missing value for primary key ${c as string}`,
                  );
                }
                return `${c as string}.eq.${v}`;
              })})`,
          )
          .join(','),
      );
    }

    const primaryKeysData = input.map((i) =>
      primaryKeys.reduce<R>((prev, key) => {
        return {
          ...prev,
          [key]: i[key],
        };
      }, {} as R),
    );

    const query = buildNormalizedQuery<Q>(opts);
    if (query) {
      const { selectQuery, groupedUserQueryPaths, groupedPaths } = query;
      // make sure that primary keys are included in the select query
      const groupedPathsWithPrimaryKeys = groupedPaths;
      const addKeys: string[] = [];
      primaryKeys.forEach((key) => {
        if (!groupedPathsWithPrimaryKeys.find((p) => p.path === key)) {
          groupedPathsWithPrimaryKeys.push({
            declaration: key as string,
            path: key as string,
          });
          addKeys.push(key as string);
        }
      });
      const { data } = await filterBuilder
        .select([selectQuery, ...addKeys].join(','))
        .throwOnError();
      return (data as R[]).map((d) =>
        buildMutationFetcherResponse(d, {
          groupedPaths: groupedPathsWithPrimaryKeys,
          groupedUserQueryPaths,
        }),
      );
    }

    await filterBuilder.throwOnError();

    if (opts.queriesForTable().length > 0) {
      // if there is at least one query on the table we are deleting from, return primary keys
      return primaryKeysData.map((pk) => ({ normalizedData: pk }));
    }

    return null;
  };
