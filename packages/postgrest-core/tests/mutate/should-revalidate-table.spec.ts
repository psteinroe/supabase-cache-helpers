import { describe, expect, it } from 'vitest';
import { shouldRevalidateTable } from '../../src/mutate/should-revalidate-table';

describe('should-revalidate-table', () => {
  it('should set tables defined in revalidateTables to stale', async () => {
    expect(
      shouldRevalidateTable([{ schema: 'schema', table: 'relation' }], {
        decodedKey: {
          schema: 'schema',
          table: 'relation',
        },
      }),
    ).toBe(true);
  });

  it('should use same schema as table if none is defined in revalidateTables', async () => {
    expect(
      shouldRevalidateTable([{ table: 'relation' }], {
        decodedKey: {
          schema: 'schema',
          table: 'relation',
        },
      }),
    ).toBe(true);
  });
});
