import { buildSelectStatement } from "../src/build-query";

describe("buildSelectStatement", () => {
  it("should build nested paths correctly", () => {
    expect(
      buildSelectStatement([
        { alias: undefined, path: "name" },
        { alias: undefined, path: "prop2" },
        { alias: undefined, path: "prop3" },
        { alias: "city.test", path: "cities.name" },
        { alias: undefined, path: "countries.capital" },
        { alias: undefined, path: "countries.population" },
        { alias: "countries.some_ref.test", path: "countries.some_ref.first" },
        { alias: undefined, path: "countries.some_ref.second" },
        { alias: "alias.prop", path: "test.prop" },
      ])
    ).toEqual("");
  });

  it("should work for mapped names", () => {
    expect(
      buildSelectStatement([
        { alias: undefined, path: "name" },
        { alias: "organisation.test", path: "organisation_id.name" },
      ])
    ).toEqual("");
  });

  it("should work for inner joins", () => {
    expect(
      buildSelectStatement([
        { alias: undefined, path: "name" },
        { alias: "organisation.test", path: "organisation.name" },
      ])
    ).toEqual("");
  });

  it("should work for json operators", () => {
    expect(
      buildSelectStatement([{ alias: "field", path: "name->nested" }])
    ).toEqual("");
  });
});
