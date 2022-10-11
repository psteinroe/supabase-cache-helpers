import { buildInsertMutatorFn } from "../../src/lib/build-insert-mutator-fn";

type ItemType = {
  id_1: string;
  id_2: string;
};

describe("buildInsertMutatorFn", () => {
  it("should prepend item to first page", () => {
    expect(
      buildInsertMutatorFn<ItemType>({ id_1: "0", id_2: "0" })([
        [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
        ],
        [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
        ],
      ])
    ).toEqual([
      [
        { id_1: "0", id_2: "0" },
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
      buildInsertMutatorFn<ItemType>({ id_1: "0", id_2: "0" })(undefined as any)
    ).toEqual(undefined);
  });

  it("should do nothing if cached data is null", () => {
    expect(
      buildInsertMutatorFn<ItemType>({ id_1: "0", id_2: "0" })(null as any)
    ).toEqual(null);
  });

  it("should return input if data is undefined", () => {
    expect(
      buildInsertMutatorFn<ItemType>({ id_1: "0", id_2: "0" })({
        data: null,
      })
    ).toMatchObject({
      data: { id_1: "0", id_2: "0" },
    });
  });

  it("should prepend item to cached array", () => {
    expect(
      buildInsertMutatorFn<ItemType>({ id_1: "0", id_2: "0" })({
        data: [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
        ],
        count: 3,
      })
    ).toMatchObject({
      data: [
        { id_1: "0", id_2: "0" },
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
      ],
    });
  });

  it("should add count if item was added", () => {
    expect(
      buildInsertMutatorFn<ItemType>({ id_1: "0", id_2: "0" })({
        data: [
          { id_1: "1", id_2: "0" },
          { id_1: "0", id_2: "1" },
        ],
        count: 2,
      })
    ).toEqual({
      data: [
        { id_1: "0", id_2: "0" },
        { id_1: "1", id_2: "0" },
        { id_1: "0", id_2: "1" },
      ],
      count: 3,
    });
  });
});
