import { buildSortedComparator } from "../../src/lib/sorted-comparator";

type ItemType = {
  [idx: string]: string | number | Date | null;
  value_1: number | Date | null;
  value_2: number | Date | null;
};

describe("sortedComparator", () => {
  it("ascending", () => {
    expect(
      [
        { value_1: 1, value_2: 1 },
        { value_1: 3, value_2: 3 },
        { value_1: 2, value_2: 2 },
      ].sort(
        buildSortedComparator<ItemType>([
          { column: "value_1", ascending: true, nullsFirst: false },
        ])
      )
    ).toEqual([
      { value_1: 1, value_2: 1 },
      { value_1: 2, value_2: 2 },
      { value_1: 3, value_2: 3 },
    ]);
  });

  it("descending", () => {
    expect(
      [
        { value_1: 1, value_2: 1 },
        { value_1: 3, value_2: 3 },
        { value_1: 2, value_2: 2 },
      ].sort(
        buildSortedComparator<ItemType>([
          { column: "value_1", ascending: false, nullsFirst: false },
        ])
      )
    ).toEqual([
      { value_1: 3, value_2: 3 },
      { value_1: 2, value_2: 2 },
      { value_1: 1, value_2: 1 },
    ]);
  });

  it("nullsFirst", () => {
    expect(
      [
        { value_1: 1, value_2: 1 },
        { value_1: null, value_2: 3 },
        { value_1: 2, value_2: 2 },
      ].sort(
        buildSortedComparator<ItemType>([
          { column: "value_1", ascending: true, nullsFirst: true },
        ])
      )
    ).toEqual([
      { value_1: null, value_2: 3 },
      { value_1: 1, value_2: 1 },
      { value_1: 2, value_2: 2 },
    ]);
  });

  it("nullsLast", () => {
    expect(
      [
        { value_1: 1, value_2: 1 },
        { value_1: null, value_2: 3 },
        { value_1: 2, value_2: 2 },
      ].sort(
        buildSortedComparator<ItemType>([
          { column: "value_1", ascending: true, nullsFirst: false },
        ])
      )
    ).toEqual([
      { value_1: 1, value_2: 1 },
      { value_1: 2, value_2: 2 },
      { value_1: null, value_2: 3 },
    ]);
  });

  it("multiple", () => {
    expect(
      [
        { value_1: 1, value_2: 3 },
        { value_1: 3, value_2: 1 },
        { value_1: 1, value_2: 2 },
      ].sort(
        buildSortedComparator<ItemType>([
          { column: "value_1", ascending: true, nullsFirst: false },
          { column: "value_2", ascending: true, nullsFirst: false },
        ])
      )
    ).toEqual([
      { value_1: 1, value_2: 2 },
      { value_1: 1, value_2: 3 },
      { value_1: 3, value_2: 1 },
    ]);
  });

  it("foreign table", () => {
    expect(
      [
        { foreign: { value_1: 1 }, value_2: 1 },
        { foreign: { value_1: 3 }, value_2: 3 },
        { foreign: { value_1: 2 }, value_2: 2 },
      ].sort(
        buildSortedComparator<{
          foreign: { value_1: number };
          value_2: number;
        }>([
          {
            column: "value_1",
            ascending: true,
            nullsFirst: false,
            foreignTable: "foreign",
          },
        ])
      )
    ).toEqual([
      { foreign: { value_1: 1 }, value_2: 1 },
      { foreign: { value_1: 2 }, value_2: 2 },
      { foreign: { value_1: 3 }, value_2: 3 },
    ]);
  });

  it("with Date values", () => {
    expect(
      [
        { value_1: new Date("December 1, 1995 03:24:00"), value_2: 1 },
        { value_1: new Date("December 3, 1995 03:24:00"), value_2: 3 },
        { value_1: new Date("December 2, 1995 03:24:00"), value_2: 2 },
      ].sort(
        buildSortedComparator<ItemType>([
          { column: "value_1", ascending: true, nullsFirst: false },
        ])
      )
    ).toEqual([
      { value_1: new Date("December 1, 1995 03:24:00"), value_2: 1 },
      { value_1: new Date("December 2, 1995 03:24:00"), value_2: 2 },
      { value_1: new Date("December 3, 1995 03:24:00"), value_2: 3 },
    ]);
  });
});
