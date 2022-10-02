import { buildUpdateMutator } from "../src";

type ItemType = {
  id_1: string;
  id_2: string;
  value: string;
};

describe("update", () => {
  it("should update item within paged cache data", () => {
    expect(
      buildUpdateMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj): obj is ItemType {
            return true;
          },
        }
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

  it("should remove item within paged cache data if updated item is invalid", () => {
    expect(
      buildUpdateMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj): obj is ItemType {
            return false;
          },
        }
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
      ],
    ]);
  });

  it("should do nothing if cached data is undefined", () => {
    expect(
      buildUpdateMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj): obj is ItemType {
            return true;
          },
        }
      )(undefined as any)
    ).toEqual(undefined);
  });

  it("should do nothing if cached data is null", () => {
    expect(
      buildUpdateMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj): obj is ItemType {
            return true;
          },
        }
      )(null as any)
    ).toEqual(null);
  });

  it("should update item within cached array", () => {
    expect(
      buildUpdateMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj): obj is ItemType {
            return true;
          },
        }
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

  it("should remove item within cached array if updated item is invalid", () => {
    expect(
      buildUpdateMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj): obj is ItemType {
            return false;
          },
        }
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

  it("should set data to null if updated item is invalid", () => {
    expect(
      buildUpdateMutator<ItemType>(
        { id_1: "0", id_2: "0", value: "test" },
        ["id_1", "id_2"],
        {
          apply(obj): obj is ItemType {
            return false;
          },
        }
      )({
        data: { id_1: "0", id_2: "0", value: "test5" },
      })
    ).toEqual({
      data: undefined,
    });
  });
});
