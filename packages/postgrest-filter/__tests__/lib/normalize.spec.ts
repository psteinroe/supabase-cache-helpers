import { normalize } from "../../src";

describe("normalize", () => {
  it("should return input if falsy", () => {
    expect(normalize(null, "")).toEqual(null);
  });
  it("should normalize with aliases", () => {
    expect(
      normalize(
        { name: "Test", city: { test: "Test" }, other: "Test" },
        `name,
                city:cities (
                  test:name
                ),
                other:prop`
      )
    ).toEqual({ name: "Test", cities: { name: "Test" }, prop: "Test" });
  });
});
