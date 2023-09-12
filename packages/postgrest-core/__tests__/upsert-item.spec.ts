import { mutate } from '../src/mutate/mutate';
import { upsertItem } from '../src/upsert-item';

jest.mock('../src/mutate/mutate', () => ({
  mutate: jest.fn().mockImplementation(() => jest.fn()),
}));

type ItemType = {
  id: string;
  value: string;
  fkey: string;
};

describe('upsertItem', () => {
  it('should call mutate with type upsert', () => {
    upsertItem(
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
            denormalize: (obj) => obj,
            apply(obj: unknown): obj is ItemType {
              return true;
            },
            applyFilters(obj: unknown): obj is ItemType {
              return true;
            },
            hasPaths(obj: unknown): obj is ItemType {
              return true;
            },
          };
        },
        mutate: jest.fn(),
      }
    );
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'UPSERT' }),
      expect.anything(),
      undefined
    );
  });
});
