import { DecodedKey, PostgrestFilter } from '../src';
import {
  AnyPostgrestResponse,
  PostgrestHasMorePaginationResponse,
} from '../src/lib/response-types';
import { UpsertItemOperation, upsert, upsertItem } from '../src/upsert-item';

type ItemType = {
  [idx: string]: string | null;
  id_1: string;
  id_2: string;
  value: string | null;
};

const mutateFnMock = async (
  input: ItemType,
  decodedKey: null | Partial<DecodedKey>,
  postgrestFilter: Partial<Record<keyof PostgrestFilter<ItemType>, boolean>>,
) => {
  const mutate = jest.fn();
  const revalidate = jest.fn();
  await upsertItem<string, ItemType>(
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
          denormalize<ItemType>(obj: ItemType): ItemType {
            return obj;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return typeof postgrestFilter.hasPaths === 'boolean'
              ? postgrestFilter.hasPaths
              : true;
          },
          applyFilters(obj): obj is ItemType {
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
      mutate,
      revalidate,
    },
  );

  return { mutate, revalidate };
};

type RelationType = {
  id: string;
  fkey: string;
};

const mutateRelationMock = async (
  decodedKey: null | Partial<DecodedKey>,
  op?: Pick<
    UpsertItemOperation<RelationType>,
    'revalidateTables' | 'revalidateRelations'
  >,
) => {
  const mutate = jest.fn();
  const revalidate = jest.fn();
  await upsertItem<string, RelationType>(
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
          hasPaths(obj: unknown): obj is RelationType {
            return true;
          },
          applyFilters(obj): obj is RelationType {
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
      mutate,
      revalidate,
    },
  );

  return { revalidate, mutate };
};

const mutateFnResult = async (
  input: ItemType,
  decodedKey: Partial<DecodedKey>,
  postgrestFilter: Partial<Record<keyof PostgrestFilter<ItemType>, boolean>>,
  currentData:
    | AnyPostgrestResponse<ItemType>
    | PostgrestHasMorePaginationResponse<ItemType>
    | unknown,
  merge?: (c: ItemType, i: ItemType) => ItemType,
) => {
  return await new Promise(async (res) => {
    upsertItem<string, ItemType>(
      {
        input,
        schema: 'schema',
        table: 'table',
        primaryKeys: ['id_1', 'id_2'],
        merge,
      },

      {
        cacheKeys: ['1'],
        decode() {
          return {
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
            hasPaths(obj: unknown): obj is ItemType {
              return typeof postgrestFilter.hasPaths === 'boolean'
                ? postgrestFilter.hasPaths
                : true;
            },
            applyFilters(obj): obj is ItemType {
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
        revalidate: jest.fn(),
        mutate: jest.fn((_, fn) => {
          expect(fn).toBeDefined();
          expect(fn).toBeInstanceOf(Function);
          res(fn!(currentData));
        }),
      },
    );
  });
};

describe('upsertItem', () => {
  it('should call revalidate for revalidateRelations', async () => {
    const { revalidate } = await mutateRelationMock(
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
    const { revalidate } = await mutateRelationMock(
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
    const { mutate, revalidate } = await mutateFnMock(
      { id_1: '0', id_2: '0', value: 'test' },
      null,
      {},
    );
    expect(mutate).toHaveBeenCalledTimes(0);
    expect(revalidate).toHaveBeenCalledTimes(0);
  });

  it('should not apply mutation if key does have filters on pks, but input does not match pk filters', async () => {
    const { mutate } = await mutateFnMock(
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
    expect(mutate).toHaveBeenCalledTimes(0);
  });

  it('should apply mutation if key does have filters on pks, and input does match pk filters', async () => {
    const { mutate } = await mutateFnMock(
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
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('should apply mutation if key does not have filters on pks', async () => {
    const { mutate } = await mutateFnMock(
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
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('should prepend item to first page if it contains all required paths', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {
          limit: 2,
        },
        {
          apply: true,
          hasPaths: true,
        },
        [
          [
            { id_1: '1', id_2: '0', value: 'test1' },
            { id_1: '0', id_2: '1', value: 'test2' },
          ],
          [
            { id_1: '1', id_2: '0', value: 'test3' },
            { id_1: '0', id_2: '1', value: 'test4' },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: '0', id_2: '0', value: 'test' },
        { id_1: '1', id_2: '0', value: 'test1' },
      ],
      [
        { id_1: '0', id_2: '1', value: 'test2' },
        { id_1: '1', id_2: '0', value: 'test3' },
      ],
      [{ id_1: '0', id_2: '1', value: 'test4' }],
    ]);
  });

  it('should not prepend item to first page if it does not contain all required paths', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {
          limit: 2,
        },
        {
          apply: false,
          hasPaths: false,
        },
        [
          [
            { id_1: '1', id_2: '0', value: 'test1' },
            { id_1: '0', id_2: '1', value: 'test2' },
          ],
          [
            { id_1: '1', id_2: '0', value: 'test3' },
            { id_1: '0', id_2: '1', value: 'test4' },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: '1', id_2: '0', value: 'test1' },
        { id_1: '0', id_2: '1', value: 'test2' },
      ],
      [
        { id_1: '1', id_2: '0', value: 'test3' },
        { id_1: '0', id_2: '1', value: 'test4' },
      ],
    ]);
  });

  it('should update item within paged cache data', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {
          limit: 3,
        },
        {
          apply: true,
          hasPaths: false,
        },
        [
          [
            { id_1: '1', id_2: '0', value: 'test1' },
            { id_1: '0', id_2: '1', value: 'test2' },
            { id_1: '1', id_2: '0', value: 'test3' },
          ],
          [
            { id_1: '0', id_2: '1', value: 'test4' },
            { id_1: '0', id_2: '0', value: 'test5' },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: '1', id_2: '0', value: 'test1' },
        { id_1: '0', id_2: '1', value: 'test2' },
        { id_1: '1', id_2: '0', value: 'test3' },
      ],
      [
        { id_1: '0', id_2: '1', value: 'test4' },
        { id_1: '0', id_2: '0', value: 'test' },
      ],
    ]);
  });

  it('should remove item if updated values do not apply to key', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '1', value: 'test' },
        {
          limit: 2,
        },
        {
          apply: false,
          hasPaths: false,
        },
        [
          [
            { id_1: '1', id_2: '0', value: 'test1' },
            { id_1: '0', id_2: '1', value: 'test2' },
          ],
          [
            { id_1: '0', id_2: '0', value: 'test3' },
            { id_1: '1', id_2: '1', value: 'test4' },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: '1', id_2: '0', value: 'test1' },
        { id_1: '0', id_2: '0', value: 'test3' },
      ],
      [{ id_1: '1', id_2: '1', value: 'test4' }],
    ]);
  });

  it('should do nothing if cached data is undefined', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: true, hasPaths: true },
        undefined,
      ),
    ).toEqual(undefined);
  });

  it('should do nothing if cached data is null', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: true, hasPaths: true },
        null,
      ),
    ).toEqual(null);
  });

  it('should do nothing if cached data is null', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: true, hasPaths: true },
        [
          { id_1: '1', id_2: '0', value: 'array1' },
          { id_1: '0', id_2: '1', value: 'array2' },
        ],
      ),
    ).toEqual([
      { id_1: '1', id_2: '0', value: 'array1' },
      { id_1: '0', id_2: '1', value: 'array2' },
    ]);
  });

  it('should prepend item to cached array if it has all required paths', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: true, hasPaths: true },
        {
          data: [
            { id_1: '1', id_2: '0', value: 'test1' },
            { id_1: '0', id_2: '1', value: 'test2' },
          ],
          count: 2,
        },
      ),
    ).toEqual({
      data: [
        { id_1: '0', id_2: '0', value: 'test' },
        { id_1: '1', id_2: '0', value: 'test1' },
        { id_1: '0', id_2: '1', value: 'test2' },
      ],
      count: 3,
    });
  });

  it('should not prepend item to cached array if it does not have all required paths', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: false, hasPaths: false },
        {
          data: [
            { id_1: '1', id_2: '0', value: 'test1' },
            { id_1: '0', id_2: '1', value: 'test2' },
          ],
          count: 2,
        },
      ),
    ).toEqual({
      data: [
        { id_1: '1', id_2: '0', value: 'test1' },
        { id_1: '0', id_2: '1', value: 'test2' },
      ],
      count: 2,
    });
  });

  it('should update item within cached array', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: true, hasPaths: false },
        {
          data: [
            { id_1: '1', id_2: '0', value: 'test3' },
            { id_1: '0', id_2: '1', value: 'test4' },
            { id_1: '0', id_2: '0', value: 'test5' },
          ],
          count: 3,
        },
      ),
    ).toEqual({
      data: [
        { id_1: '1', id_2: '0', value: 'test3' },
        { id_1: '0', id_2: '1', value: 'test4' },
        { id_1: '0', id_2: '0', value: 'test' },
      ],
      count: 3,
    });
  });

  it('should use custom merge fn', async () => {
    const mergeFn = jest
      .fn()
      .mockImplementation((_, input) => ({ ...input, value: 'merged' }));
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: true, hasPaths: false },
        {
          data: [
            { id_1: '1', id_2: '0', value: 'test3' },
            { id_1: '0', id_2: '1', value: 'test4' },
            { id_1: '0', id_2: '0', value: 'test5' },
          ],
          count: 3,
        },
        mergeFn,
      ),
    ).toEqual({
      data: [
        { id_1: '1', id_2: '0', value: 'test3' },
        { id_1: '0', id_2: '1', value: 'test4' },
        { id_1: '0', id_2: '0', value: 'merged' },
      ],
      count: 3,
    });
    expect(mergeFn).toHaveBeenCalledWith(
      { id_1: '0', id_2: '0', value: 'test5' },
      { id_1: '0', id_2: '0', value: 'test' },
    );
  });

  it('should remove item within cached array if values do not match after update', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: false, hasPaths: false },
        {
          data: [
            { id_1: '1', id_2: '0', value: 'test3' },
            { id_1: '0', id_2: '1', value: 'test4' },
            { id_1: '0', id_2: '0', value: 'test5' },
          ],
          count: 3,
        },
      ),
    ).toEqual({
      data: [
        { id_1: '1', id_2: '0', value: 'test3' },
        { id_1: '0', id_2: '1', value: 'test4' },
      ],
      count: 2,
    });
  });

  it('should set data to undefined if updated item is invalid', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: false, hasPaths: false },
        { data: { id_1: '0', id_2: '0', value: 'test5' } },
      ),
    ).toEqual({
      data: null,
    });
  });
  it('should return merged data if updated item matches the key filter', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: true, hasPaths: true },
        { data: { id_1: '0', id_2: '0', value: 'test5' } },
      ),
    ).toEqual({
      data: { id_1: '0', id_2: '0', value: 'test' },
    });
  });

  it('should respect order by asc', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test4' },
        {
          limit: 2,
          orderByKey: 'value:asc.nullsFirst',
        },
        { apply: true, hasPaths: false },
        [
          [
            { id_1: '1', id_2: '0', value: 'test1' },
            { id_1: '0', id_2: '1', value: 'test2' },
          ],
          [
            { id_1: '2', id_2: '0', value: 'test3' },
            { id_1: '0', id_2: '2', value: 'test5' },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: '1', id_2: '0', value: 'test1' },
        { id_1: '0', id_2: '1', value: 'test2' },
      ],
      [
        { id_1: '2', id_2: '0', value: 'test3' },
        { id_1: '0', id_2: '0', value: 'test4' },
      ],
      [{ id_1: '0', id_2: '2', value: 'test5' }],
    ]);
  });

  it('should respect order by desc', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test4' },
        {
          limit: 2,
          orderByKey: 'value:desc.nullsFirst',
        },
        { apply: true, hasPaths: false },
        [
          [
            { id_1: '1', id_2: '0', value: 'test5' },
            { id_1: '0', id_2: '1', value: 'test3' },
          ],
          [
            { id_1: '2', id_2: '0', value: 'test2' },
            { id_1: '0', id_2: '2', value: 'test1' },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: '1', id_2: '0', value: 'test5' },
        { id_1: '0', id_2: '0', value: 'test4' },
      ],
      [
        { id_1: '0', id_2: '1', value: 'test3' },
        { id_1: '2', id_2: '0', value: 'test2' },
      ],
      [{ id_1: '0', id_2: '2', value: 'test1' }],
    ]);
  });

  it('should respect order by nullsFirst', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: null },
        {
          limit: 2,
          orderByKey: 'value:asc.nullsFirst',
        },
        { apply: true, hasPaths: false },
        [
          [
            { id_1: '1', id_2: '0', value: 'test1' },
            { id_1: '0', id_2: '1', value: 'test2' },
          ],
          [
            { id_1: '2', id_2: '0', value: 'test3' },
            { id_1: '0', id_2: '2', value: 'test5' },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: '0', id_2: '0', value: null },
        { id_1: '1', id_2: '0', value: 'test1' },
      ],
      [
        { id_1: '0', id_2: '1', value: 'test2' },
        { id_1: '2', id_2: '0', value: 'test3' },
      ],
      [{ id_1: '0', id_2: '2', value: 'test5' }],
    ]);
  });

  it('should respect order by nullsLast', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: null },
        {
          limit: 2,
          orderByKey: 'value:asc.nullsLast',
        },
        { apply: true, hasPaths: false },
        [
          [
            { id_1: '1', id_2: '0', value: 'test1' },
            { id_1: '0', id_2: '1', value: 'test2' },
          ],
          [
            { id_1: '2', id_2: '0', value: 'test3' },
            { id_1: '0', id_2: '2', value: 'test5' },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: '1', id_2: '0', value: 'test1' },
        { id_1: '0', id_2: '1', value: 'test2' },
      ],
      [
        { id_1: '2', id_2: '0', value: 'test3' },
        { id_1: '0', id_2: '2', value: 'test5' },
      ],
      [{ id_1: '0', id_2: '0', value: null }],
    ]);
  });

  it('should set hasMore properly', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {
          limit: 2,
        },
        { apply: true, hasPaths: false },
        [
          {
            data: [
              { id_1: '1', id_2: '0', value: 'test1' },
              { id_1: '0', id_2: '1', value: 'test2' },
            ],
            hasMore: true,
          },
          {
            data: [
              { id_1: '1', id_2: '0', value: 'test3' },
              { id_1: '0', id_2: '1', value: 'test4' },
            ],
            hasMore: false,
          },
        ],
      ),
    ).toEqual([
      {
        data: [
          { id_1: '0', id_2: '0', value: 'test' },
          { id_1: '1', id_2: '0', value: 'test1' },
        ],
        hasMore: true,
      },
      {
        data: [
          { id_1: '0', id_2: '1', value: 'test2' },
          { id_1: '1', id_2: '0', value: 'test3' },
        ],
        hasMore: true,
      },
      { data: [{ id_1: '0', id_2: '1', value: 'test4' }], hasMore: false },
    ]);
  });

  it('should work with head queries', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        { apply: true, hasPaths: true },
        {
          data: null,
          count: 3,
        },
      ),
    ).toEqual({
      data: null,
      count: 3,
    });
  });

  describe('upsert', () => {
    type ItemType = {
      [idx: string]: string | number | null;
      id_1: number;
      id_2: number;
      value_1: number | null;
      value_2: number | null;
    };

    it('insert unordered', () => {
      expect(
        upsert<ItemType>(
          { id_1: 0, id_2: 0, value_1: 1, value_2: 1 },
          [
            { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
            { id_1: 2, id_2: 2, value_1: 2, value_2: 2 },
            { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
          ],
          ['id_1', 'id_2'],
          {
            apply(obj: unknown): obj is ItemType {
              return true;
            },
          },
        ),
      ).toEqual([
        { id_1: 0, id_2: 0, value_1: 1, value_2: 1 },
        { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
        { id_1: 2, id_2: 2, value_1: 2, value_2: 2 },
        { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
      ]);
    });

    it('insert ordered', () => {
      expect(
        upsert<ItemType>(
          { id_1: 0, id_2: 0, value_1: 0, value_2: 0 },
          [
            { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
            { id_1: 2, id_2: 2, value_1: 2, value_2: 2 },
            { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
          ],
          ['id_1', 'id_2'],
          {
            apply(obj: unknown): obj is ItemType {
              return true;
            },
          },
          undefined,
          [{ column: 'value_1', ascending: false, nullsFirst: false }],
        ),
      ).toEqual([
        { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
        { id_1: 2, id_2: 2, value_1: 2, value_2: 2 },
        { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
        { id_1: 0, id_2: 0, value_1: 0, value_2: 0 },
      ]);
    });

    it('update unordered', () => {
      expect(
        upsert<ItemType>(
          { id_1: 0, id_2: 0, value_1: 1, value_2: 1 },
          [
            { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
            { id_1: 0, id_2: 0, value_1: 2, value_2: 2 },
            { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
          ],
          ['id_1', 'id_2'],

          {
            apply(obj: unknown): obj is ItemType {
              return true;
            },
          },
        ),
      ).toEqual([
        { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
        { id_1: 0, id_2: 0, value_1: 1, value_2: 1 },
        { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
      ]);
    });

    it('update ordered', () => {
      expect(
        upsert<ItemType>(
          { id_1: 2, id_2: 2, value_1: 0, value_2: 0 },
          [
            { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
            { id_1: 2, id_2: 2, value_1: 2, value_2: 2 },
            { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
          ],
          ['id_1', 'id_2'],
          {
            apply(obj: unknown): obj is ItemType {
              return true;
            },
          },
          undefined,
          [{ column: 'value_1', ascending: false, nullsFirst: false }],
        ),
      ).toEqual([
        { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
        { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
        { id_1: 2, id_2: 2, value_1: 0, value_2: 0 },
      ]);
    });

    it('custom merge', () => {
      const mergeMock = jest.fn().mockImplementation((_, __) => ({
        id_1: 2,
        id_2: 2,
        value_1: -1,
        value_2: -1,
      }));
      expect(
        upsert<ItemType>(
          { id_1: 2, id_2: 2, value_1: 0, value_2: 0 },
          [
            { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
            { id_1: 2, id_2: 2, value_1: 2, value_2: 2 },
            { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
          ],
          ['id_1', 'id_2'],
          {
            apply(obj: unknown): obj is ItemType {
              return true;
            },
          },
          mergeMock,
          [{ column: 'value_1', ascending: false, nullsFirst: false }],
        ),
      ).toEqual([
        { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
        { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
        { id_1: 2, id_2: 2, value_1: -1, value_2: -1 },
      ]);
      expect(mergeMock).toHaveBeenCalledWith(
        { id_1: 2, id_2: 2, value_1: 2, value_2: 2 },
        { id_1: 2, id_2: 2, value_1: 0, value_2: 0 },
      );
    });
  });
});
