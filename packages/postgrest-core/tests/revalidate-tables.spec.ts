import { describe, expect, it, vi } from 'vitest';

import { revalidateTables } from '../src/revalidate-tables';

describe('revalidateTables', () => {
  it('should do nothing if the cache key is not a valid PostgREST key', async () => {
    const decode = vi.fn().mockImplementationOnce(() => null);
    const revalidate = vi.fn();

    await revalidateTables(
      {
        tables: [{ table: 'table', schema: 'public' }],
      },
      {
        cacheKeys: ['1'],
        decode,
        revalidate,
      },
    );

    expect(decode).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledTimes(0);
  });

  it('should revalidate if table and schema match', async () => {
    const decode = vi
      .fn()
      .mockImplementationOnce(() => ({ schema: 'public', table: 'table' }));
    const revalidate = vi.fn();

    await revalidateTables(
      {
        tables: [{ table: 'table', schema: 'public' }],
      },
      {
        cacheKeys: ['1'],
        decode,
        revalidate,
      },
    );

    expect(decode).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledWith('1');
  });

  it('should revalidate if table matches and schema is undefined in revalidateTables', async () => {
    const decode = vi
      .fn()
      .mockImplementationOnce(() => ({ schema: 'public', table: 'table' }));
    const revalidate = vi.fn();

    await revalidateTables(
      {
        tables: [{ table: 'table' }],
      },
      {
        cacheKeys: ['1'],
        decode,
        revalidate,
      },
    );

    expect(decode).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledWith('1');
  });

  it('should not revalidate if table does not match', async () => {
    const decode = vi.fn().mockImplementationOnce(() => ({
      schema: 'public',
      table: 'different-table',
    }));
    const revalidate = vi.fn();

    await revalidateTables(
      {
        tables: [{ table: 'table', schema: 'public' }],
      },
      {
        cacheKeys: ['1'],
        decode,
        revalidate,
      },
    );

    expect(decode).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledTimes(0);
  });

  it('should not revalidate if schema does not match', async () => {
    const decode = vi.fn().mockImplementationOnce(() => ({
      schema: 'different-schema',
      table: 'table',
    }));
    const revalidate = vi.fn();

    await revalidateTables(
      {
        tables: [{ table: 'table', schema: 'public' }],
      },
      {
        cacheKeys: ['1'],
        decode,
        revalidate,
      },
    );

    expect(decode).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledTimes(0);
  });

  it('should revalidate multiple cache keys', async () => {
    const decode = vi
      .fn()
      .mockImplementationOnce(() => ({ schema: 'public', table: 'table1' }))
      .mockImplementationOnce(() => ({ schema: 'public', table: 'table2' }))
      .mockImplementationOnce(() => ({ schema: 'public', table: 'table3' }));
    const revalidate = vi.fn();

    await revalidateTables(
      {
        tables: [
          { table: 'table1', schema: 'public' },
          { table: 'table3', schema: 'public' },
        ],
      },
      {
        cacheKeys: ['1', '2', '3'],
        decode,
        revalidate,
      },
    );

    expect(decode).toHaveBeenCalledTimes(3);
    expect(revalidate).toHaveBeenCalledTimes(2);
    expect(revalidate).toHaveBeenCalledWith('1');
    expect(revalidate).toHaveBeenCalledWith('3');
  });

  it('should wait for all revalidations to complete', async () => {
    const decode = vi
      .fn()
      .mockImplementationOnce(() => ({ schema: 'public', table: 'table1' }))
      .mockImplementationOnce(() => ({ schema: 'public', table: 'table2' }));

    let resolved1 = false;
    let resolved2 = false;

    const revalidate = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              resolved1 = true;
              resolve();
            }, 10);
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              resolved2 = true;
              resolve();
            }, 5);
          }),
      );

    await revalidateTables(
      {
        tables: [
          { table: 'table1', schema: 'public' },
          { table: 'table2', schema: 'public' },
        ],
      },
      {
        cacheKeys: ['1', '2'],
        decode,
        revalidate,
      },
    );

    expect(decode).toHaveBeenCalledTimes(2);
    expect(revalidate).toHaveBeenCalledTimes(2);
    expect(resolved1).toBe(true);
    expect(resolved2).toBe(true);
  });
});
