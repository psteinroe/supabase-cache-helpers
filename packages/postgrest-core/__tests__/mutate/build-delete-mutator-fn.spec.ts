import { buildDeleteMutatorFn } from '../../src/mutate/build-delete-mutator-fn';

type ItemType = {
  id_1: string;
  id_2: string;
};

describe('buildDeleteMutatorFn', () => {
  it('should return undefined if data is single', () => {
    expect(
      buildDeleteMutatorFn<ItemType>({ id_1: '0', id_2: '0' }, [
        'id_1',
        'id_2',
      ])({
        data: { id_1: '0', id_2: '0' },
      }),
    ).toMatchObject({
      data: null,
    });
  });

  it('should delete item from cached array', () => {
    expect(
      buildDeleteMutatorFn<ItemType>({ id_1: '0', id_2: '0' }, [
        'id_1',
        'id_2',
      ])({
        data: [
          { id_1: '1', id_2: '0' },
          { id_1: '0', id_2: '1' },
          { id_1: '0', id_2: '0' },
        ],
        count: 3,
      }),
    ).toMatchObject({
      data: [
        { id_1: '1', id_2: '0' },
        { id_1: '0', id_2: '1' },
      ],
    });
  });

  it('should subtract count if item was removed', () => {
    expect(
      buildDeleteMutatorFn<ItemType>({ id_1: '0', id_2: '0' }, [
        'id_1',
        'id_2',
      ])({
        data: [
          { id_1: '1', id_2: '0' },
          { id_1: '0', id_2: '1' },
          { id_1: '0', id_2: '0' },
        ],
        count: 3,
      }),
    ).toEqual({
      data: [
        { id_1: '1', id_2: '0' },
        { id_1: '0', id_2: '1' },
      ],
      count: 2,
    });
  });

  it('should not subtract count if no item was removed', () => {
    expect(
      buildDeleteMutatorFn<ItemType>({ id_1: '0', id_2: '0' }, [
        'id_1',
        'id_2',
      ])({
        data: [
          { id_1: '1', id_2: '0' },
          { id_1: '0', id_2: '1' },
          { id_1: '1', id_2: '1' },
        ],
        count: 3,
      }),
    ).toMatchObject({
      data: [
        { id_1: '1', id_2: '0' },
        { id_1: '0', id_2: '1' },
        { id_1: '1', id_2: '1' },
      ],
      count: 3,
    });
  });

  it('should work with pagination cache data', () => {
    expect(
      buildDeleteMutatorFn<ItemType>(
        { id_1: '0', id_2: '0' },
        ['id_1', 'id_2'],
        { limit: 3 },
      )([
        {
          hasMore: true,
          data: [
            { id_1: '1', id_2: '0' },
            { id_1: '0', id_2: '1' },
            { id_1: '0', id_2: '0' },
          ],
        },
        {
          hasMore: false,
          data: [
            { id_1: '1', id_2: '0' },
            { id_1: '0', id_2: '1' },
          ],
        },
      ]),
    ).toEqual([
      {
        data: [
          { id_1: '1', id_2: '0' },
          { id_1: '0', id_2: '1' },
          { id_1: '1', id_2: '0' },
        ],
        hasMore: true,
      },
      { data: [{ id_1: '0', id_2: '1' }], hasMore: false },
    ]);
  });
});
