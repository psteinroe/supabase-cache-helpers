import type { DecodedKey, PostgrestFilter } from '../src';
import {
  type RevalidateForUpsertOperation,
  revalidateForUpsert,
} from '../src/revalidate-for-upsert';
import { describe, expect, it, vi } from 'vitest';

type ItemType = {
  [idx: string]: string | null;
  id_1: string;
  id_2: string;
  value: string | null;
};

const upsertItemMock = async (
  input: ItemType,
  decodedKey: null | Partial<DecodedKey>,
  postgrestFilter: Partial<Record<keyof PostgrestFilter<ItemType>, boolean>>,
  cachedData?: ItemType[],
) => {
  const revalidate = vi.fn();
  const getData = vi.fn().mockReturnValue(cachedData);
  await revalidateForUpsert<string, ItemType>(
    {
      input,
      schema: 'schema',
      table: 'table',
      primaryKeys: ['id_1', 'id_2'],
    },
    {
      cacheKeys: ['1'],
      decode() {
        return decodedKey === null
          ? null
          : {
              schema: decodedKey.schema || 'schema',
              table: decodedKey.table || 'table',
              queryKey: decodedKey.queryKey || 'queryKey',
              bodyKey: decodedKey.bodyKey,
              orderByKey: decodedKey.orderByKey,
              count: decodedKey.count || null,
              isHead: decodedKey.isHead,
              limit: decodedKey.limit,
              offset: decodedKey.offset,
            };
      },
      getPostgrestFilter() {
        return {
          get hasWildcardPath(): boolean {
            return typeof postgrestFilter.hasWildcardPath === 'boolean'
              ? postgrestFilter.hasWildcardPath
              : false;
          },
          get hasAggregatePath(): boolean {
            return typeof postgrestFilter.hasAggregatePath === 'boolean'
              ? postgrestFilter.hasAggregatePath
              : false;
          },
          denormalize<ItemType>(obj: ItemType): ItemType {
            return obj;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return typeof postgrestFilter.hasPaths === 'boolean'
              ? postgrestFilter.hasPaths
              : true;
          },
          applyFilters(obj: unknown): obj is ItemType {
            return typeof postgrestFilter.applyFilters === 'boolean'
              ? postgrestFilter.applyFilters
              : true;
          },
          hasFiltersOnPaths() {
            return typeof postgrestFilter.hasFiltersOnPaths === 'boolean'
              ? postgrestFilter.hasFiltersOnPaths
              : true;
          },
          applyFiltersOnPaths(obj: unknown): obj is ItemType {
            return typeof postgrestFilter.applyFiltersOnPaths === 'boolean'
              ? postgrestFilter.applyFiltersOnPaths
              : true;
          },
          apply(obj: unknown): obj is ItemType {
            return typeof postgrestFilter.apply === 'boolean'
              ? postgrestFilter.apply
              : true;
          },
        };
      },
      revalidate,
      getData,
    },
  );

  return { revalidate, getData };
};

type RelationType = {
  id: string;
  fkey: string;
};

const upsertRelationMock = async (
  decodedKey: null | Partial<DecodedKey>,
  op?: Partial<
    Pick<
      RevalidateForUpsertOperation<RelationType>,
      'revalidateTables' | 'revalidateRelations'
    >
  >,
) => {
  const revalidate = vi.fn();
  const getData = vi.fn().mockReturnValue(undefined);
  await revalidateForUpsert<string, RelationType>(
    {
      input: { id: '1', fkey: '1' },
      schema: 'schema',
      table: 'table',
      primaryKeys: ['id'],
      ...op,
    },
    {
      cacheKeys: ['1'],
      decode() {
        return decodedKey === null
          ? null
          : {
              schema: decodedKey.schema || 'schema',
              table: decodedKey.table || 'relation',
              queryKey: decodedKey.queryKey || 'queryKey',
              bodyKey: decodedKey.bodyKey,
              orderByKey: decodedKey.orderByKey,
              count: decodedKey.count || null,
              isHead: decodedKey.isHead,
              limit: decodedKey.limit,
              offset: decodedKey.offset,
            };
      },
      getPostgrestFilter() {
        return {
          get hasWildcardPath(): boolean {
            return false;
          },
          get hasAggregatePath(): boolean {
            return false;
          },
          denormalize<RelationType>(obj: RelationType): RelationType {
            return obj;
          },
          hasPaths(obj: unknown): obj is RelationType {
            return true;
          },
          applyFilters(obj: unknown): obj is RelationType {
            return true;
          },
          hasFiltersOnPaths() {
            return true;
          },
          applyFiltersOnPaths(obj: unknown): obj is RelationType {
            return true;
          },
          apply(obj: unknown): obj is RelationType {
            return true;
          },
        };
      },
      revalidate,
      getData,
    },
  );

  return { revalidate, getData };
};

describe('upsertItem', () => {
  it('should call revalidate for revalidateRelations', async () => {
    const { revalidate } = await upsertRelationMock(
      {
        schema: 'schema',
        table: 'relation',
      },
      {
        revalidateRelations: [
          {
            relation: 'relation',
            fKeyColumn: 'fkey',
            relationIdColumn: 'id',
            schema: 'schema',
          },
        ],
      },
    );
    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledWith('1');
  });

  it('should call revalidate for revalidateTables', async () => {
    const { revalidate } = await upsertRelationMock(
      {
        schema: 'schema',
        table: 'relation',
      },
      {
        revalidateTables: [{ schema: 'schema', table: 'relation' }],
      },
    );
    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledWith('1');
  });

  it('should exit early if not a postgrest key', async () => {
    const { revalidate, getData } = await upsertItemMock(
      { id_1: '0', id_2: '0', value: 'test' },
      null,
      {},
    );
    expect(getData).toHaveBeenCalledTimes(0);
    expect(revalidate).toHaveBeenCalledTimes(0);
  });

  it('should not revalidate if key has filters on pks but input does not match pk filters', async () => {
    const { revalidate } = await upsertItemMock(
      { value: '123' } as ItemType,
      {},
      {
        apply: false,
        applyFilters: false,
        hasPaths: false,
        hasFiltersOnPaths: true,
        applyFiltersOnPaths: false,
      },
    );
    expect(revalidate).toHaveBeenCalledTimes(0);
  });

  it('should revalidate if key has filters on pks and input matches pk filters', async () => {
    const { revalidate } = await upsertItemMock(
      { id_1: '0', id_2: '0', value: 'test' },
      {},
      {
        apply: false,
        applyFilters: false,
        hasPaths: false,
        hasFiltersOnPaths: true,
        applyFiltersOnPaths: true,
      },
    );
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('should revalidate if key does not have filters on pks', async () => {
    const { revalidate } = await upsertItemMock(
      { id_1: '0', value: 'test' } as ItemType,
      {},
      {
        apply: false,
        applyFilters: false,
        hasPaths: false,
        hasFiltersOnPaths: false,
        applyFiltersOnPaths: true,
      },
    );
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('should revalidate isHead query', async () => {
    const { revalidate } = await upsertItemMock(
      { id_1: '0', id_2: '0', value: 'test' },
      { isHead: true },
      {
        apply: false,
        applyFilters: false,
        hasPaths: false,
        hasFiltersOnPaths: false,
        applyFiltersOnPaths: false,
      },
    );
    expect(revalidate).toHaveBeenCalledTimes(1);
  });
});
