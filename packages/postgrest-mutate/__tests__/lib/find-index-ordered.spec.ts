import { findIndexOrdered } from "../../src/lib/find-index-ordered";

type ItemType = {
  [idx: string]: string | number | null;
  value_1: number | null;
  value_2: number | null;
};

describe("findIndexOrdered", () => {
  it("ascending", () => {
    expect(
      findIndexOrdered<ItemType>(
        { value_1: 3, value_2: 3 },
        [
          { value_1: 1, value_2: 1 },
          { value_1: 2, value_2: 2 },
          { value_1: 3, value_2: 3 },
        ],
        [{ column: "value_1", ascending: true, nullsFirst: false }]
      )
    ).toEqual(2);
  });

  it("descending", () => {
    expect(
      findIndexOrdered<ItemType>(
        { value_1: 1, value_2: 3 },
        [
          { value_1: 3, value_2: 1 },
          { value_1: 2, value_2: 2 },
          { value_1: 1, value_2: 3 },
        ],
        [{ column: "value_1", ascending: false, nullsFirst: false }]
      )
    ).toEqual(2);
  });

  it("nullsFirst", () => {
    expect(
      findIndexOrdered<ItemType>(
        { value_1: 2, value_2: 3 },
        [
          { value_1: null, value_2: 1 },
          { value_1: 2, value_2: 2 },
          { value_1: 3, value_2: 3 },
        ],
        [{ column: "value_1", ascending: true, nullsFirst: true }]
      )
    ).toEqual(1);
  });

  it("nullsLast", () => {
    expect(
      findIndexOrdered<ItemType>(
        { value_1: 2, value_2: 3 },
        [
          { value_1: 1, value_2: 1 },
          { value_1: 2, value_2: 2 },
          { value_1: null, value_2: 3 },
        ],
        [{ column: "value_1", ascending: true, nullsFirst: true }]
      )
    ).toEqual(1);
  });

  it("multiple", () => {
    expect(
      findIndexOrdered<ItemType>(
        { value_1: 3, value_2: 1 },
        [
          { value_1: 1, value_2: 2 },
          { value_1: 1, value_2: 3 },
          { value_1: 3, value_2: 2 },
        ],
        [
          { column: "value_1", ascending: true, nullsFirst: false },
          { column: "value_2", ascending: true, nullsFirst: false },
        ]
      )
    ).toEqual(2);
  });
});
