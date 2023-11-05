import { DecodedKey } from '../dist';
import { deleteItem } from '../src/delete-item';
import {
  AnyPostgrestResponse,
  PostgrestHasMorePaginationResponse,
} from '../src/lib/response-types';

type ItemType = {
  [idx: string]: string | null;
  id_1: string;
  id_2: string;
  value: string | null;
};

const mutateFnResult = async (
  input: ItemType,
  decodedKey: Partial<DecodedKey>,
  currentData:
    | AnyPostgrestResponse<ItemType>
    | PostgrestHasMorePaginationResponse<ItemType>
    | unknown,
) => {
  return await new Promise(async (res) => {
    deleteItem<string, ItemType>(
      {
        input,
        schema: 'schema',
        table: 'table',
        primaryKeys: ['id_1', 'id_2'],
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
            denormalize(obj: ItemType): ItemType {
              return obj;
            },
            applyFilters(obj): obj is ItemType {
              return true;
            },
          };
        },
        mutate: jest.fn((_, fn) => {
          expect(fn).toBeDefined();
          expect(fn).toBeInstanceOf(Function);
          res(fn!(currentData));
        }),
      },
    );
  });
};

describe('deleteItem', () => {
  it('should delete item from paged cache data', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {
          limit: 3,
        },
        [
          [
            { id_1: '1', id_2: '0' },
            { id_1: '0', id_2: '1' },
            { id_1: '0', id_2: '0' },
          ],
          [
            { id_1: '1', id_2: '0' },
            { id_1: '0', id_2: '1' },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: '1', id_2: '0' },
        { id_1: '0', id_2: '1' },
        { id_1: '1', id_2: '0' },
      ],
      [{ id_1: '0', id_2: '1' }],
    ]);
  });

  it('should do nothing if cached data is undefined', async () => {
    expect(
      await mutateFnResult(
        { id_1: '0', id_2: '0', value: 'test' },
        {},
        undefined,
      ),
    ).toEqual(undefined);
  });

  it('should do nothing if cached data is null', async () => {
    expect(
      await mutateFnResult({ id_1: '0', id_2: '0', value: 'test' }, {}, null),
    ).toEqual(null);
  });
});
