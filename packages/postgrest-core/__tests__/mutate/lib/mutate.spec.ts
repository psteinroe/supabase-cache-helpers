import { buildDeleteMutatorFn } from '../../../src/mutate/lib/build-delete-mutator-fn';
import { buildUpsertMutatorFn } from '../../../src/mutate/lib/build-upsert-mutator-fn';
import { mutate, OperationType } from '../../../src/mutate/lib/mutate';
import {
  DecodedKey,
  PostgrestMutatorOpts,
} from '../../../src/mutate/lib/types';

jest.mock('../../../src/mutate/lib/build-delete-mutator-fn', () => ({
  buildDeleteMutatorFn: jest.fn().mockImplementation(() => jest.fn()),
}));
jest.mock('../../../src/mutate/lib/build-upsert-mutator-fn', () => ({
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
    applyFiltersOnPaths: boolean;
    hasFiltersOnPaths: boolean;
  };
  decode: DecodedKey | null;
  input?: ItemType;
  opts?: PostgrestMutatorOpts<ItemType>;
  schema?: string;
};

const mockMutate = async ({
  type,
  postgrestFilter,
  decode,
  opts,
  input = { id: '0', value: 'test', fkey: 'fkey' },
  schema = 'schema',
}: MockMutateProps) => {
  const mutateMockFn = jest.fn();
  await mutate(
    {
      input: input as ItemType,
      schema,
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
          applyFiltersOnPaths: (obj: unknown): obj is ItemType =>
            postgrestFilter.applyFiltersOnPaths,
          hasFiltersOnPaths() {
            return postgrestFilter.hasFiltersOnPaths;
          },
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
      postgrestFilter: {
        apply: true,
        applyFilters: true,
        hasPaths: true,
        hasFiltersOnPaths: true,
        applyFiltersOnPaths: true,
      },
      decode: null,
    });
    expect(buildDeleteMutatorFn).toHaveBeenCalledTimes(0);
    expect(buildUpsertMutatorFn).toHaveBeenCalledTimes(0);
    expect(mutateMock).toHaveBeenCalledTimes(0);
  });

  it('should not apply mutation if key does have filters on pks, but input does not match pk filters', async () => {
    const mutateMock = await mockMutate({
      type: 'UPSERT',
      input: { value: '123' } as ItemType,
      postgrestFilter: {
        apply: false,
        applyFilters: false,
        hasPaths: false,
        hasFiltersOnPaths: true,
        applyFiltersOnPaths: false,
      },
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
    expect(buildUpsertMutatorFn).toHaveBeenCalledTimes(0);
    expect(mutateMock).toHaveBeenCalledTimes(0);
  });

  it('should apply mutation if key does have filters on pks, and input does match pk filters', async () => {
    const mutateMock = await mockMutate({
      type: 'UPSERT',
      input: { value: '123' } as ItemType,
      postgrestFilter: {
        apply: false,
        applyFilters: false,
        hasPaths: false,
        hasFiltersOnPaths: true,
        applyFiltersOnPaths: true,
      },
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
    expect(buildUpsertMutatorFn).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  it('should apply mutation if key does not have filters on pks', async () => {
    const mutateMock = await mockMutate({
      input: { id: '0', value: '123' } as ItemType,
      type: 'UPSERT',
      postgrestFilter: {
        apply: false,
        applyFilters: false,
        hasPaths: false,
        hasFiltersOnPaths: false,
        applyFiltersOnPaths: true,
      },
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
    expect(buildUpsertMutatorFn).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  it.each([['UPSERT'], ['DELETE']])(
    'should %s with correct mutator fn',
    async (type) => {
      const mutateMock = await mockMutate({
        type: type as OperationType,
        postgrestFilter: {
          apply: true,
          applyFilters: true,
          hasPaths: true,

          hasFiltersOnPaths: true,
          applyFiltersOnPaths: true,
        },
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
      postgrestFilter: {
        apply: true,
        applyFilters: true,
        hasPaths: true,

        hasFiltersOnPaths: true,
        applyFiltersOnPaths: true,
      },
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
      postgrestFilter: {
        apply: true,
        applyFilters: true,
        hasPaths: true,

        hasFiltersOnPaths: true,
        applyFiltersOnPaths: true,
      },
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
      postgrestFilter: {
        apply: true,
        applyFilters: true,
        hasPaths: true,

        hasFiltersOnPaths: true,
        applyFiltersOnPaths: true,
      },
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

  it('should use same schema as table if none is set on revalidateRelations', async () => {
    const mutateMock = await mockMutate({
      type: 'UPSERT',
      postgrestFilter: {
        apply: true,
        applyFilters: true,
        hasPaths: true,

        hasFiltersOnPaths: true,
        applyFiltersOnPaths: true,
      },
      schema: 'public',
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
      postgrestFilter: {
        apply: true,
        applyFilters: true,
        hasPaths: true,

        hasFiltersOnPaths: true,
        applyFiltersOnPaths: true,
      },
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

  it('should use same schema as table if none is defined in revalidateTables', async () => {
    const mutateMock = await mockMutate({
      type: 'UPSERT',
      postgrestFilter: {
        apply: true,
        applyFilters: true,
        hasPaths: true,
        hasFiltersOnPaths: true,
        applyFiltersOnPaths: true,
      },
      schema: 'public',
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
        revalidateTables: [{ table: 'relation' }],
      },
    });
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith('1');
  });
});
