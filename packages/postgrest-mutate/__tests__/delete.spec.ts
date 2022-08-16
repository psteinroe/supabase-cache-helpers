import { buildDeleteMutator } from "../src";

type ItemType = {
  id_1: string;
  id_2: string;
};

describe("delete", () => {
  it("should delete item from paged cache data", () => {
    expect(
      buildDeleteMutator<ItemType>({ id_1: "0", id_2: "0" }, ["id_1", "id_2"])([
        [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
        ],
        [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
          { id_1: "0", id_2: "0" },
        ],
      ])
    ).toEqual([
      [
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
      ],
      [
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
      ],
    ]);
  });

  it("should do nothing if cached data is undefined", () => {
    expect(
      buildDeleteMutator<ItemType>({ id_1: "0", id_2: "0" }, ["id_1", "id_2"])(
        undefined as any
      )
    ).toEqual(undefined);
  });

  it("should do nothing if cached data is null", () => {
    expect(
      buildDeleteMutator<ItemType>({ id_1: "0", id_2: "0" }, ["id_1", "id_2"])(
        null as any
      )
    ).toEqual(null);
  });

  it("should delete item from cached array", () => {
    expect(
      buildDeleteMutator<ItemType>({ id_1: "0", id_2: "0" }, ["id_1", "id_2"])({
        data: [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
          { id_1: "0", id_2: "0" },
        ],
        count: 3,
      })
    ).toMatchObject({
      data: [
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
      ],
    });
  });

  it("should subtract count if item was removed", () => {
    expect(
      buildDeleteMutator<ItemType>({ id_1: "0", id_2: "0" }, ["id_1", "id_2"])({
        data: [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
          { id_1: "0", id_2: "0" },
        ],
        count: 3,
      })
    ).toEqual({
      data: [
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
      ],
      count: 2,
    });
  });

  it("should not subtract count if no item was removed", () => {
    expect(
      buildDeleteMutator<ItemType>({ id_1: "0", id_2: "0" }, ["id_1", "id_2"])({
        data: [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
          { id_1: "1", id_2: "1" },
        ],
        count: 3,
      })
    ).toMatchObject({
      data: [
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
        { id_1: "1", id_2: "1" },
      ],
      count: 3,
    });
  });
});
