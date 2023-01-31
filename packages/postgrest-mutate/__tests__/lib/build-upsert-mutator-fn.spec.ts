import { buildUpsertMutatorFn } from "../../src/lib/build-upsert-mutator-fn";

type ItemType = {
  [idx: string]: string;
  id_1: string;
  id_2: string;
  value: string;
};

describe("buildUpsertMutatorFn", () => {
  it("should prepend item to first page if it contains all required paths", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return true;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return true;
          },
        },
        { limit: undefined, orderBy: undefined }
      )([
        [
          { id_1: "1", id_2: "0", value: "test1" },
          { id_1: "0", id_2: "1", value: "test2" },
        ],
        [
          { id_1: "1", id_2: "0", value: "test3" },
          { id_1: "0", id_2: "1", value: "test4" },
        ],
      ])
    ).toEqual([
      [
        { id_1: "0", id_2: "0", value: "test" },
        { id_1: "1", id_2: "0", value: "test1" },
        { id_1: "0", id_2: "1", value: "test2" },
      ],
      [
        { id_1: "1", id_2: "0", value: "test3" },
        { id_1: "0", id_2: "1", value: "test4" },
      ],
    ]);
  });

  it("should not prepend item to first page if it does not contain all required paths", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return false;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return false;
          },
        },
        { limit: undefined, orderBy: undefined }
      )([
        [
          { id_1: "1", id_2: "0", value: "test1" },
          { id_1: "0", id_2: "1", value: "test2" },
        ],
        [
          { id_1: "1", id_2: "0", value: "test3" },
          { id_1: "0", id_2: "1", value: "test4" },
        ],
      ])
    ).toEqual([
      [
        { id_1: "1", id_2: "0", value: "test1" },
        { id_1: "0", id_2: "1", value: "test2" },
      ],
      [
        { id_1: "1", id_2: "0", value: "test3" },
        { id_1: "0", id_2: "1", value: "test4" },
      ],
    ]);
  });

  it("should update item within paged cache data", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return true;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return false;
          },
        },
        { limit: undefined, orderBy: undefined }
      )([
        [
          { id_1: "1", id_2: "0", value: "test1" },
          { id_1: "0", id_2: "1", value: "test2" },
        ],
        [
          { id_1: "1", id_2: "0", value: "test3" },
          { id_1: "0", id_2: "1", value: "test4" },
          { id_1: "0", id_2: "0", value: "test5" },
        ],
      ])
    ).toEqual([
      [
        { id_1: "1", id_2: "0", value: "test1" },
        { id_1: "0", id_2: "1", value: "test2" },
      ],
      [
        { id_1: "1", id_2: "0", value: "test3" },
        { id_1: "0", id_2: "1", value: "test4" },
        { id_1: "0", id_2: "0", value: "test" },
      ],
    ]);
  });

  it("should remove item if updated values do not apply to key", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "1", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return false;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return false;
          },
        },
        { limit: undefined, orderBy: undefined }
      )([
        [
          { id_1: "1", id_2: "0", value: "test1" },
          { id_1: "0", id_2: "1", value: "test2" },
        ],
        [
          { id_1: "0", id_2: "0", value: "test3" },
          { id_1: "1", id_2: "1", value: "test4" },
        ],
      ])
    ).toEqual([
      [{ id_1: "1", id_2: "0", value: "test1" }],
      [
        { id_1: "0", id_2: "0", value: "test3" },
        { id_1: "1", id_2: "1", value: "test4" },
      ],
    ]);
  });

  it("should do nothing if cached data is undefined", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return true;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return true;
          },
        },
        { limit: undefined, orderBy: undefined }
      )(undefined as any)
    ).toEqual(undefined);
  });

  it("should do nothing if cached data is null", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return true;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return true;
          },
        },
        { limit: undefined, orderBy: undefined }
      )(null as any)
    ).toEqual(null);
  });

  it("should do nothing if cached data is just an array", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return true;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return true;
          },
        },
        { limit: undefined, orderBy: undefined }
      )([
        { id_1: "1", id_2: "0", value: "array1" },
        { id_1: "0", id_2: "1", value: "array2" },
      ] as any)
    ).toEqual([
      { id_1: "1", id_2: "0", value: "array1" },
      { id_1: "0", id_2: "1", value: "array2" },
    ]);
  });

  it("should prepend item to cached array if it has all required paths", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return true;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return true;
          },
        },
        { limit: undefined, orderBy: undefined }
      )({
        data: [
          { id_1: "1", id_2: "0", value: "test1" },
          { id_1: "0", id_2: "1", value: "test2" },
        ],
        count: 2,
      })
    ).toEqual({
      data: [
        { id_1: "0", id_2: "0", value: "test" },
        { id_1: "1", id_2: "0", value: "test1" },
        { id_1: "0", id_2: "1", value: "test2" },
      ],
      count: 3,
    });
  });

  it("should not prepend item to cached array if it does not have all required paths", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return false;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return false;
          },
        },
        { limit: undefined, orderBy: undefined }
      )({
        data: [
          { id_1: "1", id_2: "0", value: "test1" },
          { id_1: "0", id_2: "1", value: "test2" },
        ],
        count: 2,
      })
    ).toEqual({
      data: [
        { id_1: "1", id_2: "0", value: "test1" },
        { id_1: "0", id_2: "1", value: "test2" },
      ],
      count: 2,
    });
  });

  it("should update item within cached array", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return true;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return false;
          },
        },
        { limit: undefined, orderBy: undefined }
      )({
        data: [
          { id_1: "1", id_2: "0", value: "test3" },
          { id_1: "0", id_2: "1", value: "test4" },
          { id_1: "0", id_2: "0", value: "test5" },
        ],
        count: 3,
      })
    ).toEqual({
      data: [
        { id_1: "1", id_2: "0", value: "test3" },
        { id_1: "0", id_2: "1", value: "test4" },
        { id_1: "0", id_2: "0", value: "test" },
      ],
      count: 3,
    });
  });

  it("should use custom merge fn", () => {
    const mergeFn = jest
      .fn()
      .mockImplementation((_, input) => ({ ...input, value: "merged" }));
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return true;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return false;
          },
        },
        { limit: undefined, orderBy: undefined },
        { merge: mergeFn }
      )({
        data: [
          { id_1: "1", id_2: "0", value: "test3" },
          { id_1: "0", id_2: "1", value: "test4" },
          { id_1: "0", id_2: "0", value: "test5" },
        ],
        count: 3,
      })
    ).toEqual({
      data: [
        { id_1: "1", id_2: "0", value: "test3" },
        { id_1: "0", id_2: "1", value: "test4" },
        { id_1: "0", id_2: "0", value: "merged" },
      ],
      count: 3,
    });
    expect(mergeFn).toHaveBeenCalledWith(
      { id_1: "0", id_2: "0", value: "test5" },
      { id_1: "0", id_2: "0", value: "test" }
    );
  });

  it("should remove item within cached array if values do not match after update", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return false;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return false;
          },
        },
        { limit: undefined, orderBy: undefined }
      )({
        data: [
          { id_1: "1", id_2: "0", value: "test3" },
          { id_1: "0", id_2: "1", value: "test4" },
          { id_1: "0", id_2: "0", value: "test5" },
        ],
        count: 3,
      })
    ).toEqual({
      data: [
        { id_1: "1", id_2: "0", value: "test3" },
        { id_1: "0", id_2: "1", value: "test4" },
      ],
      count: 2,
    });
  });

  it("should set data to undefined if updated item is invalid", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return false;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return false;
          },
        },
        { limit: undefined, orderBy: undefined }
      )({
        data: { id_1: "0", id_2: "0", value: "test5" },
      })
    ).toEqual({
      data: null,
    });
  });
  it("should return merged data if updated item matches the key filter", () => {
    expect(
      buildUpsertMutatorFn<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj: unknown): obj is ItemType {
            return true;
          },
          hasPaths(obj: unknown): obj is ItemType {
            return true;
          },
        },
        { limit: undefined, orderBy: undefined }
      )({
        data: { id_1: "0", id_2: "0", value: "test5" },
      })
    ).toEqual({
      data: { id_1: "0", id_2: "0", value: "test" },
    });
  });
});
