import { buildUpsertMutator } from "../src";

type ItemType = {
  [idx: string]: string;
  id_1: string;
  id_2: string;
  value: string;
};

describe("upsert", () => {
  it("should prepend item to first page if it contains all required paths", () => {
    expect(
      buildUpsertMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        () => true
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
      buildUpsertMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        () => false
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
      buildUpsertMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        () => false
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

  it("should do nothing if cached data is undefined", () => {
    expect(
      buildUpsertMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        () => true
      )(undefined as any)
    ).toEqual(undefined);
  });

  it("should do nothing if cached data is null", () => {
    expect(
      buildUpsertMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        () => true
      )(null as any)
    ).toEqual(null);
  });

  it("should prepend item to cached array if it has all required paths", () => {
    expect(
      buildUpsertMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        () => true
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
      buildUpsertMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        () => false
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
      buildUpsertMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        () => false
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
});
