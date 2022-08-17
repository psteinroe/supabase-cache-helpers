import { buildUpdateMutator } from "../src";

type ItemType = {
  id_1: string;
  id_2: string;
  value: string;
};

describe("update", () => {
  it("should update item within paged cache data", () => {
    expect(
      buildUpdateMutator<ItemType>({ id_1: "0", id_2: "0", value: "test" }, [
        "id_1",
        "id_2",
      ])([
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
      buildUpdateMutator<ItemType>({ id_1: "0", id_2: "0", value: "test" }, [
        "id_1",
        "id_2",
      ])(undefined as any)
    ).toEqual(undefined);
  });

  it("should do nothing if cached data is null", () => {
    expect(
      buildUpdateMutator<ItemType>({ id_1: "0", id_2: "0", value: "test" }, [
        "id_1",
        "id_2",
      ])(null as any)
    ).toEqual(null);
  });

  it("should update item within cached array", () => {
    expect(
      buildUpdateMutator<ItemType>({ id_1: "0", id_2: "0", value: "test" }, [
        "id_1",
        "id_2",
      ])({
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
