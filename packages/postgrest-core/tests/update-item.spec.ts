import type { DecodedKey } from '../src';
import {
  type MergeFn,
  type UpdateItemOperation,
  updateItem,
  updateItemInCacheData,
  createUpdateHelpers,
} from '../src/update-item';
import { describe, expect, it, vi } from 'vitest';

type ItemType = {
  [idx: string]: string | number | null | undefined;
  id: string;
  name: string;
  value: number | null;
};

type CompositeKeyType = {
  [idx: string]: string | null;
  id_1: string;
  id_2: string;
  value: string | null;
};

const updateItemMock = async (
  input: ItemType,
  decodedKey: null | Partial<DecodedKey>,
  opts?: {
    schema?: string;
    table?: string;
    merge?: MergeFn<ItemType>;
  },
) => {
  const mutate = vi.fn();
  await updateItem<string, ItemType>(
    {
      input,
      schema: opts?.schema ?? 'schema',
      table: opts?.table ?? 'table',
      primaryKeys: ['id'],
      merge: opts?.merge,
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
        };
      },
      mutate,
    },
  );

  return { mutate };
};

describe('updateItem', () => {
  describe('cache key filtering', () => {
    it('should exit early if not a postgrest key', async () => {
      const { mutate } = await updateItemMock(
        { id: '1', name: 'test', value: 100 },
        null,
      );
      expect(mutate).toHaveBeenCalledTimes(0);
    });

    it('should exit early if schema does not match', async () => {
      const { mutate } = await updateItemMock(
        { id: '1', name: 'test', value: 100 },
        { schema: 'other_schema' },
      );
      expect(mutate).toHaveBeenCalledTimes(0);
    });

    it('should exit early if table does not match', async () => {
      const { mutate } = await updateItemMock(
        { id: '1', name: 'test', value: 100 },
        { table: 'other_table' },
      );
      expect(mutate).toHaveBeenCalledTimes(0);
    });

    it('should skip isHead queries', async () => {
      const { mutate } = await updateItemMock(
        { id: '1', name: 'test', value: 100 },
        { isHead: true },
      );
      expect(mutate).toHaveBeenCalledTimes(0);
    });

    it('should call mutate for matching schema and table', async () => {
      const { mutate } = await updateItemMock(
        { id: '1', name: 'test', value: 100 },
        { schema: 'schema', table: 'table' },
      );
      expect(mutate).toHaveBeenCalledTimes(1);
      expect(mutate).toHaveBeenCalledWith('1', {
        id: '1',
        name: 'test',
        value: 100,
      });
    });

    it('should skip if primary key is missing from input', async () => {
      const mutate = vi.fn();
      await updateItem<string, ItemType>(
        {
          input: { name: 'test', value: 100 } as ItemType,
          schema: 'schema',
          table: 'table',
          primaryKeys: ['id'],
        },
        {
          cacheKeys: ['1'],
          decode() {
            return {
              schema: 'schema',
              table: 'table',
              queryKey: 'queryKey',
              count: null,
            };
          },
          getPostgrestFilter() {
            return {
              denormalize<ItemType>(obj: ItemType): ItemType {
                return obj;
              },
            };
          },
          mutate,
        },
      );
      expect(mutate).toHaveBeenCalledTimes(0);
    });
  });

  describe('multiple cache keys', () => {
    it('should call mutate for all matching keys', async () => {
      const mutate = vi.fn();
      await updateItem<string, ItemType>(
        {
          input: { id: '1', name: 'updated', value: 200 },
          schema: 'schema',
          table: 'table',
          primaryKeys: ['id'],
        },
        {
          cacheKeys: ['key1', 'key2', 'key3'],
          decode(k) {
            if (k === 'key2') return null; // Non-postgrest key
            return {
              schema: 'schema',
              table: 'table',
              queryKey: k,
              count: null,
            };
          },
          getPostgrestFilter() {
            return {
              denormalize<ItemType>(obj: ItemType): ItemType {
                return obj;
              },
            };
          },
          mutate,
        },
      );
      expect(mutate).toHaveBeenCalledTimes(2);
    });
  });
});

describe('createUpdateHelpers', () => {
  describe('matchesPK', () => {
    it('should match item with same primary key', () => {
      const input: ItemType = { id: '1', name: 'test', value: 100 };
      const { matchesPK } = createUpdateHelpers(input, ['id']);

      expect(matchesPK({ id: '1', name: 'other', value: 0 })).toBe(true);
      expect(matchesPK({ id: '2', name: 'test', value: 100 })).toBe(false);
    });

    it('should match with composite primary keys', () => {
      const input: CompositeKeyType = { id_1: 'a', id_2: 'b', value: 'test' };
      const { matchesPK } = createUpdateHelpers(input, ['id_1', 'id_2']);

      expect(matchesPK({ id_1: 'a', id_2: 'b', value: 'other' })).toBe(true);
      expect(matchesPK({ id_1: 'a', id_2: 'c', value: 'test' })).toBe(false);
      expect(matchesPK({ id_1: 'x', id_2: 'b', value: 'test' })).toBe(false);
    });

    it('should return false for null or non-object', () => {
      const input: ItemType = { id: '1', name: 'test', value: 100 };
      const { matchesPK } = createUpdateHelpers(input, ['id']);

      expect(matchesPK(null)).toBe(false);
      expect(matchesPK(undefined)).toBe(false);
      expect(matchesPK('string')).toBe(false);
      expect(matchesPK(123)).toBe(false);
    });
  });

  describe('merge', () => {
    it('should perform shallow merge by default', () => {
      const input: ItemType = { id: '1', name: 'updated', value: 200 };
      const { merge } = createUpdateHelpers(input, ['id']);

      const existing: ItemType = { id: '1', name: 'original', value: 100 };
      const result = merge(existing);

      expect(result).toEqual({ id: '1', name: 'updated', value: 200 });
    });

    it('should use custom merge function when provided', () => {
      const input: ItemType = { id: '1', name: 'updated', value: 200 };
      const customMerge: MergeFn<ItemType> = (existing, inp) => ({
        ...existing,
        ...inp,
        value: (existing.value ?? 0) + (inp.value ?? 0),
      });
      const { merge } = createUpdateHelpers(input, ['id'], customMerge);

      const existing: ItemType = { id: '1', name: 'original', value: 100 };
      const result = merge(existing);

      expect(result).toEqual({ id: '1', name: 'updated', value: 300 });
    });
  });

  describe('updateArray', () => {
    it('should update matching items in array', () => {
      const input: ItemType = { id: '2', name: 'updated', value: 999 };
      const { updateArray } = createUpdateHelpers(input, ['id']);

      const arr: ItemType[] = [
        { id: '1', name: 'first', value: 100 },
        { id: '2', name: 'second', value: 200 },
        { id: '3', name: 'third', value: 300 },
      ];

      const result = updateArray(arr);

      expect(result).toEqual([
        { id: '1', name: 'first', value: 100 },
        { id: '2', name: 'updated', value: 999 },
        { id: '3', name: 'third', value: 300 },
      ]);
    });

    it('should not modify array if no items match', () => {
      const input: ItemType = { id: '99', name: 'updated', value: 999 };
      const { updateArray } = createUpdateHelpers(input, ['id']);

      const arr: ItemType[] = [
        { id: '1', name: 'first', value: 100 },
        { id: '2', name: 'second', value: 200 },
      ];

      const result = updateArray(arr);

      expect(result).toEqual(arr);
    });

    it('should update multiple matching items', () => {
      const input: CompositeKeyType = {
        id_1: 'a',
        id_2: 'b',
        value: 'updated',
      };
      const { updateArray } = createUpdateHelpers(input, ['id_1', 'id_2']);

      const arr: CompositeKeyType[] = [
        { id_1: 'a', id_2: 'b', value: 'first' },
        { id_1: 'a', id_2: 'c', value: 'second' },
        { id_1: 'a', id_2: 'b', value: 'third' }, // Duplicate PK (edge case)
      ];

      const result = updateArray(arr);

      expect(result[0].value).toBe('updated');
      expect(result[1].value).toBe('second');
      expect(result[2].value).toBe('updated');
    });
  });
});

describe('updateItemInCacheData', () => {
  describe('simple array', () => {
    it('should update item in simple array', () => {
      const data: ItemType[] = [
        { id: '1', name: 'first', value: 100 },
        { id: '2', name: 'second', value: 200 },
      ];
      const input: ItemType = { id: '1', name: 'updated', value: 999 };

      const result = updateItemInCacheData(data, input, ['id']);

      expect(result).toEqual([
        { id: '1', name: 'updated', value: 999 },
        { id: '2', name: 'second', value: 200 },
      ]);
    });

    it('should return empty array unchanged', () => {
      const data: ItemType[] = [];
      const input: ItemType = { id: '1', name: 'updated', value: 999 };

      const result = updateItemInCacheData(data, input, ['id']);

      expect(result).toEqual([]);
    });

    it('should preserve array order', () => {
      const data: ItemType[] = [
        { id: '3', name: 'third', value: 300 },
        { id: '1', name: 'first', value: 100 },
        { id: '2', name: 'second', value: 200 },
      ];
      const input: ItemType = { id: '1', name: 'updated', value: 999 };

      const result = updateItemInCacheData(data, input, ['id']) as ItemType[];

      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('1');
      expect(result[1].name).toBe('updated');
      expect(result[2].id).toBe('2');
    });
  });

  describe('HasMore pagination', () => {
    it('should update item in HasMore pagination array', () => {
      const data = [
        { data: [{ id: '1', name: 'first', value: 100 }], hasMore: true },
        { data: [{ id: '2', name: 'second', value: 200 }], hasMore: false },
      ];
      const input: ItemType = { id: '1', name: 'updated', value: 999 };

      const result = updateItemInCacheData(data, input, ['id']) as typeof data;

      expect(result[0].data[0]).toEqual({
        id: '1',
        name: 'updated',
        value: 999,
      });
      expect(result[0].hasMore).toBe(true);
      expect(result[1].data[0]).toEqual({
        id: '2',
        name: 'second',
        value: 200,
      });
    });

    it('should update item in single HasMore response', () => {
      const data = {
        data: [
          { id: '1', name: 'first', value: 100 },
          { id: '2', name: 'second', value: 200 },
        ],
        hasMore: true,
      };
      const input: ItemType = { id: '2', name: 'updated', value: 999 };

      const result = updateItemInCacheData(data, input, ['id']) as typeof data;

      expect(result.data[0]).toEqual({ id: '1', name: 'first', value: 100 });
      expect(result.data[1]).toEqual({ id: '2', name: 'updated', value: 999 });
      expect(result.hasMore).toBe(true);
    });
  });

  describe('single object', () => {
    it('should update single object when PK matches', () => {
      const data: ItemType = { id: '1', name: 'original', value: 100 };
      const input: ItemType = { id: '1', name: 'updated', value: 999 };

      const result = updateItemInCacheData(data, input, ['id']);

      expect(result).toEqual({ id: '1', name: 'updated', value: 999 });
    });

    it('should not update single object when PK does not match', () => {
      const data: ItemType = { id: '1', name: 'original', value: 100 };
      const input: ItemType = { id: '2', name: 'updated', value: 999 };

      const result = updateItemInCacheData(data, input, ['id']);

      expect(result).toEqual({ id: '1', name: 'original', value: 100 });
    });
  });

  describe('custom merge function', () => {
    it('should use custom merge for simple array', () => {
      const data: ItemType[] = [{ id: '1', name: 'first', value: 100 }];
      const input: ItemType = { id: '1', name: 'updated', value: 50 };
      const customMerge: MergeFn<ItemType> = (existing, inp) => ({
        ...existing,
        ...inp,
        value: (existing.value ?? 0) + (inp.value ?? 0),
      });

      const result = updateItemInCacheData(
        data,
        input,
        ['id'],
        customMerge,
      ) as ItemType[];

      expect(result[0].value).toBe(150);
    });

    it('should use custom merge for single object', () => {
      const data: ItemType = { id: '1', name: 'original', value: 100 };
      const input: ItemType = { id: '1', name: 'updated', value: 50 };
      const customMerge: MergeFn<ItemType> = (existing, inp) => ({
        ...existing,
        name: `${existing.name}-${inp.name}`,
        value: inp.value,
      });

      const result = updateItemInCacheData(data, input, ['id'], customMerge);

      expect(result).toEqual({ id: '1', name: 'original-updated', value: 50 });
    });
  });

  describe('AnyPostgrestResponse wrapper', () => {
    it('should unwrap and update item in AnyPostgrestResponse', () => {
      const data = {
        data: [
          { id: '1', name: 'first', value: 100 },
          { id: '2', name: 'second', value: 200 },
        ],
        error: null,
        count: 2,
        status: 200,
        statusText: 'OK',
      };
      const input: ItemType = { id: '1', name: 'updated', value: 999 };

      const result = updateItemInCacheData(data, input, ['id']) as typeof data;

      expect(result.data).toEqual([
        { id: '1', name: 'updated', value: 999 },
        { id: '2', name: 'second', value: 200 },
      ]);
      expect(result.error).toBeNull();
      expect(result.count).toBe(2);
      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
    });

    it('should preserve all wrapper properties when updating', () => {
      const data = {
        data: [{ id: '1', name: 'original', value: 100 }],
        error: null,
        count: 1,
        status: 200,
        statusText: 'OK',
      };
      const input: ItemType = { id: '1', name: 'updated', value: 999 };

      const result = updateItemInCacheData(data, input, ['id']) as typeof data;

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('statusText');
    });
  });

  describe('edge cases', () => {
    it('should return null unchanged', () => {
      const result = updateItemInCacheData(
        null,
        { id: '1', name: 'test', value: 100 },
        ['id'],
      );
      expect(result).toBeNull();
    });

    it('should return undefined unchanged', () => {
      const result = updateItemInCacheData(
        undefined,
        { id: '1', name: 'test', value: 100 },
        ['id'],
      );
      expect(result).toBeUndefined();
    });

    it('should return primitive unchanged', () => {
      const result = updateItemInCacheData(
        'string',
        { id: '1', name: 'test', value: 100 },
        ['id'],
      );
      expect(result).toBe('string');
    });
  });
});
