import { mutate, OperationType } from '../../src/lib';
import { buildDeleteMutatorFn } from '../../src/lib/build-delete-mutator-fn';
import { buildUpsertMutatorFn } from '../../src/lib/build-upsert-mutator-fn';
import { DecodedKey, PostgrestMutatorOpts } from '../../src/lib/types';

jest.mock('../../src/lib/build-delete-mutator-fn', () => ({
  buildDeleteMutatorFn: jest.fn().mockImplementation(() => jest.fn()),
}));
jest.mock('../../src/lib/build-upsert-mutator-fn', () => ({
  buildUpsertMutatorFn: jest.fn().mockImplementation(() => jest.fn()),
}));

type ItemType = {
  id: string;
  value: string;
  fkey: string;
};

type MockMutateProps = {
  type: OperationType;
  postgrestFilter: {
    apply: boolean;
    applyFilters: boolean;
    hasPaths: boolean;
  };
  decode: DecodedKey | null;
  opts?: PostgrestMutatorOpts<ItemType>;
};

const mockMutate = async ({
  type,
  postgrestFilter,
  decode,
  opts,
}: MockMutateProps) => {
  const mutateMockFn = jest.fn();
  await mutate(
    {
      input: { id: '0', value: 'test', fkey: 'fkey' },
      schema: 'schema',
      table: 'table',
      type,
      primaryKeys: ['id'],
      opts,
    },
    {
      cacheKeys: ['1'],
      decode(k) {
        return decode;
      },
      getPostgrestFilter() {
        return {
          transform: (obj) => obj,
          apply(obj): obj is ItemType {
            return postgrestFilter.apply;
          },
          applyFilters(obj): obj is ItemType {
            return postgrestFilter.applyFilters;
          },
          hasPaths(obj): obj is ItemType {
            return postgrestFilter.hasPaths;
          },
        };
      },
      mutate: mutateMockFn,
    }
  );
  return mutateMockFn;
};

describe('mutate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should exit early if not a postgrest key', async () => {
    const mutateMock = await mockMutate({
      type: 'UPSERT',
      postgrestFilter: { apply: true, applyFilters: true, hasPaths: true },
      decode: null,
    });
    expect(buildDeleteMutatorFn).toHaveBeenCalledTimes(0);
    expect(buildUpsertMutatorFn).toHaveBeenCalledTimes(0);
    expect(mutateMock).toHaveBeenCalledTimes(0);
  });

  it('should not apply mutation if input does not match filter', async () => {
    const mutateMock = await mockMutate({
      type: 'UPSERT',
      postgrestFilter: { apply: false, applyFilters: false, hasPaths: false },
      decode: {
        queryKey: 'queryKey',
        table: 'table',
        bodyKey: undefined,
        count: null,
        isHead: false,
        schema: 'schema',
        orderByKey: '',
        limit: undefined,
        offset: undefined,
      },
    });
    expect(buildDeleteMutatorFn).toHaveBeenCalledTimes(0);
    expect(buildUpsertMutatorFn).toHaveBeenCalledTimes(0);
    expect(mutateMock).toHaveBeenCalledTimes(0);
  });

  it.each([['UPSERT'], ['DELETE']])(
    'should %s with correct mutator fn',
    async (type) => {
      const mutateMock = await mockMutate({
        type: type as OperationType,
        postgrestFilter: { apply: true, applyFilters: true, hasPaths: true },
        decode: {
          queryKey: 'queryKey',
          table: 'table',
          orderByKey: undefined,
          bodyKey: undefined,
          count: null,
          isHead: false,
          schema: 'schema',
          limit: undefined,
          offset: undefined,
        },
      });
      expect(mutateMock).toHaveBeenCalledTimes(1);
      expect(
        type === 'UPSERT'
          ? buildUpsertMutatorFn
          : type === 'DELETE'
          ? buildDeleteMutatorFn
          : jest.fn()
      ).toHaveBeenCalledTimes(1);
    }
  );

  it('should parse order by key', async () => {
    await mockMutate({
      type: 'UPSERT',
      postgrestFilter: { apply: true, applyFilters: true, hasPaths: true },
      decode: {
        queryKey: 'queryKey',
        table: 'table',
        orderByKey: 'value:desc.nullsLast',
        bodyKey: undefined,
        count: null,
        isHead: false,
        schema: 'schema',
        limit: undefined,
        offset: undefined,
      },
    });
    expect(buildUpsertMutatorFn).toHaveBeenCalledTimes(1);
    expect(buildUpsertMutatorFn).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      {
        limit: undefined,
        orderBy: [
          {
            ascending: false,
            column: 'value',
            foreignTable: undefined,
            nullsFirst: false,
          },
        ],
      },
      undefined
    );
  });

  it('should not mutate if operation is not valid', async () => {
    const mutateMock = await mockMutate({
      type: undefined as unknown as OperationType,
      postgrestFilter: { apply: true, applyFilters: true, hasPaths: true },
      decode: {
        queryKey: 'queryKey',
        table: 'table',
        bodyKey: undefined,
        count: null,
        isHead: false,
        schema: 'schema',
        limit: undefined,
        orderByKey: '',
        offset: undefined,
      },
    });
    expect(mutateMock).toHaveBeenCalledTimes(0);
    expect(buildDeleteMutatorFn).toHaveBeenCalledTimes(0);
    expect(buildUpsertMutatorFn).toHaveBeenCalledTimes(0);
  });

  it('should set relations defined in revalidateRelations to stale if fkey from input matches id', async () => {
    const mutateMock = await mockMutate({
      type: 'UPSERT',
      postgrestFilter: { apply: true, applyFilters: true, hasPaths: true },
      decode: {
        queryKey: 'queryKey',
        table: 'relation',
        bodyKey: undefined,
        count: null,
        orderByKey: '',
        isHead: false,
        schema: 'schema',
        limit: undefined,
        offset: undefined,
      },
      opts: {
        revalidateRelations: [
          {
            relation: 'relation',
            fKeyColumn: 'fkey',
            relationIdColumn: 'id',
            schema: 'schema',
          },
        ],
      },
    });
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith('1');
  });

  it('should set tables defined in revalidateTables to stale', async () => {
    const mutateMock = await mockMutate({
      type: 'UPSERT',
      postgrestFilter: { apply: true, applyFilters: true, hasPaths: true },
      decode: {
        queryKey: 'queryKey',
        table: 'relation',
        bodyKey: undefined,
        count: null,
        isHead: false,
        schema: 'schema',
        limit: undefined,
        orderByKey: '',
        offset: undefined,
      },
      opts: {
        revalidateTables: [{ schema: 'schema', table: 'relation' }],
      },
    });
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith('1');
  });
});
