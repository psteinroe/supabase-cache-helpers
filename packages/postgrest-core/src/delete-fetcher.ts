import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/postgrest-js/dist/module/types';

import {
  MutationFetcherResponse,
  buildMutationFetcherResponse,
} from './fetch/build-mutation-fetcher-response';
import {
  BuildNormalizedQueryOps,
  buildNormalizedQuery,
} from './fetch/build-normalized-query';

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

    const query = buildNormalizedQuery<Q>(opts);

    const pkAlias = (path: string): string =>
      query?.paths.find((p) => p.path === path)?.alias || path;

    if (primaryKeys.length === 1) {
      const primaryKey = primaryKeys[0] as string;
      filterBuilder.in(
        pkAlias(primaryKey),
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
                return `${pkAlias(c as string)}.eq.${v}`;
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

    if (query) {
      const { selectQuery, userQueryPaths, paths } = query;
      // make sure that primary keys are included in the select query
      const pathsWithPrimaryKeys = paths;
      const addKeys: string[] = [];
      primaryKeys.forEach((key) => {
        if (!pathsWithPrimaryKeys.find((p) => p.path === key)) {
          pathsWithPrimaryKeys.push({
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
          paths: pathsWithPrimaryKeys,
          userQueryPaths,
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
