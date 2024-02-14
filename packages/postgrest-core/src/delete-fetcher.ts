import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';

import { MutationFetcherResponse } from './fetch/build-mutation-fetcher-response';
import { BuildNormalizedQueryOps } from './fetch/build-normalized-query';
import { parseSelectParam } from './lib/parse-select-param';

export type DeleteFetcher<T extends GenericTable, R> = (
  input: Partial<T['Row']>[],
) => Promise<MutationFetcherResponse<R>[] | null>;

export type DeleteFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable,
  Re = T extends { Relationships: infer R } ? R : unknown,
> = Parameters<PostgrestQueryBuilder<S, T, Re>['delete']>[0];

export const buildDeleteFetcher =
  <
    S extends GenericSchema,
    T extends GenericTable,
    RelationName,
    Re = T extends { Relationships: infer R } ? R : unknown,
    Q extends string = '*',
    R = GetResult<S, T['Row'], RelationName, Re, Q extends '*' ? '*' : Q>,
  >(
    qb: PostgrestQueryBuilder<S, T, R>,
    primaryKeys: (keyof T['Row'])[],
    opts: BuildNormalizedQueryOps<Q> & DeleteFetcherOptions<S, T, RelationName>,
  ): DeleteFetcher<T, R> =>
  async (
    input: Partial<T['Row']>[],
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    let filterBuilder = qb.delete(opts);

    if (primaryKeys.length === 1) {
      const primaryKey = primaryKeys[0];
      filterBuilder.in(
        primaryKey as string,
        input.map((i) => {
          const v = i[primaryKey];
          if (!v) {
            throw new Error(
              `Missing value for primary key ${primaryKey as string}`,
            );
          }
          return v;
        }),
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

    if (!opts.disabled && opts.query) {
      // make sure query returns the primary keys
      const paths = parseSelectParam(opts.query);
      const addKeys = primaryKeys.filter(
        (key) => !paths.find((p) => p.path === key),
      );
      const { data } = await filterBuilder
        .select([opts.query, ...addKeys].join(','))
        .throwOnError();
      return primaryKeysData.map<MutationFetcherResponse<R>>((pk) => ({
        // since we are deleting, only the primary keys are required
        normalizedData: pk,
        userQueryData: ((data as R[]) ?? []).find((d) =>
          primaryKeys.every((k) => d[k as keyof R] === pk[k as keyof R]),
        ),
      }));
    }

    await filterBuilder.throwOnError();

    if (opts.queriesForTable().length > 0) {
      // if there is at least one query on the table we are deleting from, return primary keys
      return primaryKeysData.map((pk) => ({ normalizedData: pk }));
    }

    return null;
  };
