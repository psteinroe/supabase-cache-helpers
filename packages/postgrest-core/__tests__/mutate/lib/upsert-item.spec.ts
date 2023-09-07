import { upsert } from '../../../src/mutate/lib/upsert-item';

type ItemType = {
  [idx: string]: string | number | null;
  id_1: number;
  id_2: number;
  value_1: number | null;
  value_2: number | null;
};

describe('upsert', () => {
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
        }
      )
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
        {
          orderBy: [{ column: 'value_1', ascending: false, nullsFirst: false }],
        }
      )
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
        }
      )
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
        {
          orderBy: [{ column: 'value_1', ascending: false, nullsFirst: false }],
        }
      )
    ).toEqual([
      { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
      { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
      { id_1: 2, id_2: 2, value_1: 0, value_2: 0 },
    ]);
  });

  it('custom merge', () => {
    const mergeMock = jest.fn().mockImplementation((prevItem, newItem) => ({
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
        {
          orderBy: [{ column: 'value_1', ascending: false, nullsFirst: false }],
        },
        { merge: mergeMock }
      )
    ).toEqual([
      { id_1: 1, id_2: 1, value_1: 3, value_2: 3 },
      { id_1: 3, id_2: 3, value_1: 1, value_2: 1 },
      { id_1: 2, id_2: 2, value_1: -1, value_2: -1 },
    ]);
    expect(mergeMock).toHaveBeenCalledWith(
      { id_1: 2, id_2: 2, value_1: 2, value_2: 2 },
      { id_1: 2, id_2: 2, value_1: 0, value_2: 0 }
    );
  });
});
