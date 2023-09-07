import { deleteItem } from '../../src/mutate/delete';
import { mutate } from '../../src/mutate/lib/mutate';

jest.mock('../../src/mutate/lib/mutate', () => ({
  mutate: jest.fn().mockImplementation(() => jest.fn()),
}));

type ItemType = {
  id: string;
  value: string;
  fkey: string;
};

describe('deleteItem', () => {
  it('should call mutate with type delete', () => {
    deleteItem(
      {
        input: { id: '0', value: 'test', fkey: 'fkey' },
        schema: 'schema',
        table: 'table',
        primaryKeys: ['id'],
      },
      {
        cacheKeys: ['1'],
        decode() {
          return null;
        },
        getPostgrestFilter() {
          return {
            applyFiltersOnPaths: (obj: unknown): obj is ItemType => true,
            hasFiltersOnPaths() {
              return true;
            },
            transform: (obj) => obj,
            apply(obj): obj is ItemType {
              return true;
            },
            applyFilters(obj): obj is ItemType {
              return true;
            },
            hasPaths(obj): obj is ItemType {
              return true;
            },
          };
        },
        mutate: jest.fn(),
      }
    );
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DELETE' }),
      expect.anything()
    );
  });
});
