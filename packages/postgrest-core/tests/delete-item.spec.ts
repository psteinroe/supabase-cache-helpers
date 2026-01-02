import type { DecodedKey } from '../src';
import { type DeleteItemOperation, deleteItem } from '../src/delete-item';
import { describe, expect, it, vi } from 'vitest';

type ItemType = {
  [idx: string]: string | null | undefined;
  id_1: string;
  id_2: string;
  value: string | null;
};

const deleteItemMock = async (
  input: ItemType,
  decodedKey: null | Partial<DecodedKey>,
  cachedData?: ItemType[],
  op?: Pick<
    DeleteItemOperation<ItemType>,
    'revalidateTables' | 'revalidateRelations'
  >,
) => {
  const revalidate = vi.fn();
  const getData = vi.fn().mockReturnValue(cachedData);
  await deleteItem<string, ItemType>(
    {
      input,
      schema: 'schema',
      table: 'table',
      primaryKeys: ['id_1', 'id_2'],
      ...op,
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
          denormalize<ItemType>(obj: ItemType): ItemType {
            return obj;
          },
          applyFilters(obj): obj is ItemType {
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

type RelationType = {
  id: string;
  fkey: string;
};

const deleteRelationMock = async (
  decodedKey: null | Partial<DecodedKey>,
  op?: Pick<
    DeleteItemOperation<RelationType>,
    'revalidateTables' | 'revalidateRelations'
  >,
) => {
  const revalidate = vi.fn();
  const getData = vi.fn().mockReturnValue(undefined);
  await deleteItem<string, RelationType>(
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
          denormalize<RelationType>(obj: RelationType): RelationType {
            return obj;
          },
          applyFilters(obj): obj is RelationType {
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

describe('deleteItem', () => {
  it('should call revalidate for revalidateRelations', async () => {
    const { revalidate } = await deleteRelationMock(
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
    const { revalidate } = await deleteRelationMock(
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
    const { revalidate, getData } = await deleteItemMock(
      { id_1: '0', id_2: '0', value: 'test' },
      null,
    );
    expect(getData).toHaveBeenCalledTimes(0);
    expect(revalidate).toHaveBeenCalledTimes(0);
  });

  it('should revalidate isHead query', async () => {
    const { revalidate, getData } = await deleteItemMock(
      { id_1: '0', id_2: '0', value: 'test' },
      { isHead: true },
    );
    expect(getData).toHaveBeenCalledTimes(0);
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('should revalidate when item is found in cache', async () => {
    const { revalidate, getData } = await deleteItemMock(
      { id_1: '0', id_2: '0', value: 'test' },
      {},
      [
        { id_1: '1', id_2: '0', value: 'test1' },
        { id_1: '0', id_2: '0', value: 'test2' },
      ],
    );
    expect(getData).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('should not revalidate when item is not found in cache', async () => {
    const { revalidate, getData } = await deleteItemMock(
      { id_1: '0', id_2: '0', value: 'test' },
      {},
      [
        { id_1: '1', id_2: '0', value: 'test1' },
        { id_1: '1', id_2: '1', value: 'test2' },
      ],
    );
    expect(getData).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledTimes(0);
  });

  it('should not revalidate when cache is empty', async () => {
    const { revalidate, getData } = await deleteItemMock(
      { id_1: '0', id_2: '0', value: 'test' },
      {},
      undefined,
    );
    expect(getData).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledTimes(0);
  });
});
