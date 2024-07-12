import type { DecodedKey } from "../dist";
import { type DeleteItemOperation, deleteItem } from "../src/delete-item";
import type {
  AnyPostgrestResponse,
  PostgrestHasMorePaginationResponse,
} from "../src/lib/response-types";

type ItemType = {
  [idx: string]: string | null | undefined;
  id_1: string;
  id_2: string;
  value: string | null;
};

const mutateFnMock = async (
  input: ItemType,
  decodedKey: null | Partial<DecodedKey>,
  op?: Pick<
    DeleteItemOperation<ItemType>,
    "revalidateTables" | "revalidateRelations"
  >,
) => {
  const mutate = jest.fn();
  const revalidate = jest.fn();
  await deleteItem<string, ItemType>(
    {
      input,
      schema: "schema",
      table: "table",
      primaryKeys: ["id_1", "id_2"],
      ...op,
    },
    {
      cacheKeys: ["1"],
      decode() {
        return decodedKey === null
          ? null
          : {
              schema: decodedKey.schema || "schema",
              table: decodedKey.table || "table",
              queryKey: decodedKey.queryKey || "queryKey",
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
          denormalize<ItemType>(obj: ItemType): ItemType {
            return obj;
          },
          applyFilters(obj): obj is ItemType {
            return true;
          },
        };
      },
      mutate,
      revalidate,
    },
  );

  return { mutate, revalidate };
};

type RelationType = {
  id: string;
  fkey: string;
};

const mutateRelationMock = async (
  decodedKey: null | Partial<DecodedKey>,
  op?: Pick<
    DeleteItemOperation<RelationType>,
    "revalidateTables" | "revalidateRelations"
  >,
) => {
  const mutate = jest.fn();
  const revalidate = jest.fn();
  await deleteItem<string, RelationType>(
    {
      input: { id: "1", fkey: "1" },
      schema: "schema",
      table: "table",
      primaryKeys: ["id"],
      ...op,
    },
    {
      cacheKeys: ["1"],
      decode() {
        return decodedKey === null
          ? null
          : {
              schema: decodedKey.schema || "schema",
              table: decodedKey.table || "relation",
              queryKey: decodedKey.queryKey || "queryKey",
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
          denormalize<RelationType>(obj: RelationType): RelationType {
            return obj;
          },
          applyFilters(obj): obj is RelationType {
            return true;
          },
        };
      },
      mutate,
      revalidate,
    },
  );

  return { mutate, revalidate };
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
        schema: "schema",
        table: "table",
        primaryKeys: ["id_1", "id_2"],
      },
      {
        cacheKeys: ["1"],
        decode() {
          return {
            schema: decodedKey.schema || "schema",
            table: decodedKey.table || "table",
            queryKey: decodedKey.queryKey || "queryKey",
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
            denormalize<ItemType>(obj: ItemType): ItemType {
              return obj;
            },
            applyFilters(obj): obj is ItemType {
              return true;
            },
          };
        },
        revalidate: jest.fn(),
        mutate: jest.fn((_, fn) => {
          expect(fn).toBeDefined();
          expect(fn).toBeInstanceOf(Function);
          res(fn!(currentData));
        }),
      },
    );
  });
};

describe("deleteItem", () => {
  it("should call revalidate for revalidateRelations", async () => {
    const { revalidate } = await mutateRelationMock(
      {
        schema: "schema",
        table: "relation",
      },
      {
        revalidateRelations: [
          {
            relation: "relation",
            fKeyColumn: "fkey",
            relationIdColumn: "id",
            schema: "schema",
          },
        ],
      },
    );
    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledWith("1");
  });

  it("should call revalidate for revalidateTables", async () => {
    const { revalidate } = await mutateRelationMock(
      {
        schema: "schema",
        table: "relation",
      },
      {
        revalidateTables: [{ schema: "schema", table: "relation" }],
      },
    );
    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledWith("1");
  });

  it("should exit early if not a postgrest key", async () => {
    const { mutate, revalidate } = await mutateFnMock(
      { id_1: "0", id_2: "0", value: "test" },
      null,
    );
    expect(mutate).toHaveBeenCalledTimes(0);
    expect(revalidate).toHaveBeenCalledTimes(0);
  });

  it("should delete item from paged cache data", async () => {
    expect(
      await mutateFnResult(
        { id_1: "0", id_2: "0", value: "test" },
        {
          limit: 3,
        },
        [
          [
            { id_1: "1", id_2: "0" },
            { id_1: "0", id_2: "1" },
            { id_1: "0", id_2: "0" },
          ],
          [
            { id_1: "1", id_2: "0" },
            { id_1: "0", id_2: "1" },
          ],
        ],
      ),
    ).toEqual([
      [
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
        { id_1: "1", id_2: "0" },
      ],
      [{ id_1: "0", id_2: "1" }],
    ]);
  });

  it("should do nothing if cached data is undefined", async () => {
    expect(
      await mutateFnResult(
        { id_1: "0", id_2: "0", value: "test" },
        {},
        undefined,
      ),
    ).toEqual(undefined);
  });

  it("should do nothing if cached data is null", async () => {
    expect(
      await mutateFnResult({ id_1: "0", id_2: "0", value: "test" }, {}, null),
    ).toEqual(null);
  });

  it("should return null if data is single", async () => {
    expect(
      await mutateFnResult(
        { id_1: "0", id_2: "0", value: "test" },
        {},
        { data: { id_1: "0", id_2: "0" } },
      ),
    ).toMatchObject({
      data: null,
    });
  });

  it("should delete item from cached array and subtract count", async () => {
    expect(
      await mutateFnResult(
        { id_1: "0", id_2: "0", value: "test" },
        {},
        {
          data: [
            { id_1: "1", id_2: "0" },
            { id_1: "0", id_2: "1" },
            { id_1: "0", id_2: "0" },
          ],
          count: 3,
        },
      ),
    ).toEqual({
      data: [
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
      ],
      count: 2,
    });
  });

  it("should not delete item from cached array and subtract count if not item was removed", async () => {
    expect(
      await mutateFnResult(
        { id_1: "0", id_2: "0", value: "test" },
        {},
        {
          data: [
            { id_1: "1", id_2: "0" },
            { id_1: "0", id_2: "1" },
            { id_1: "1", id_2: "1" },
          ],
          count: 3,
        },
      ),
    ).toEqual({
      data: [
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
        { id_1: "1", id_2: "1" },
      ],
      count: 3,
    });
  });

  it("should work with pagination cache data", async () => {
    expect(
      await mutateFnResult(
        { id_1: "0", id_2: "0", value: "test" },
        { limit: 3 },
        [
          {
            hasMore: true,
            data: [
              { id_1: "1", id_2: "0" },
              { id_1: "0", id_2: "1" },
              { id_1: "0", id_2: "0" },
            ],
          },
          {
            hasMore: false,
            data: [
              { id_1: "1", id_2: "0" },
              { id_1: "0", id_2: "1" },
            ],
          },
        ],
      ),
    ).toEqual([
      {
        data: [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
          { id_1: "1", id_2: "0" },
        ],
        hasMore: true,
      },
      { data: [{ id_1: "0", id_2: "1" }], hasMore: false },
    ]);
  });
});
