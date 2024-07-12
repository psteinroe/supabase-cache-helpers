import { shouldRevalidateRelation } from '../../src/mutate/should-revalidate-relation';

describe('should-revalidate-relation', () => {
  it('should set relations defined in revalidateRelations to stale if fkey from input matches id', async () => {
    expect(
      shouldRevalidateRelation(
        [
          {
            relation: 'relation',
            fKeyColumn: 'fkey',
            relationIdColumn: 'id',
            schema: 'schema',
          },
        ],
        {
          input: {
            fkey: '1',
          },
          getPostgrestFilter: () => ({
            applyFilters: (obj: unknown): obj is any => true,
          }),
          decodedKey: {
            schema: 'schema',
            table: 'relation',
            queryKey: 'queryKey',
          },
        },
      ),
    ).toBe(true);
  });

  it('should use same schema as table if none is set on revalidateRelations', async () => {
    expect(
      shouldRevalidateRelation(
        [
          {
            relation: 'relation',
            fKeyColumn: 'fkey',
            relationIdColumn: 'id',
          },
        ],
        {
          input: {
            fkey: '1',
          },
          getPostgrestFilter: () => ({
            applyFilters: (obj: unknown): obj is any => true,
          }),
          decodedKey: {
            schema: 'schema',
            table: 'relation',
            queryKey: 'queryKey',
          },
        },
      ),
    ).toBe(true);
  });
});
