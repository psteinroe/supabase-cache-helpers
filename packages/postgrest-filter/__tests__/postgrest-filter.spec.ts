import { SupabaseClient, createClient } from "@supabase/supabase-js";

import { PostgrestFilter, PostgrestParser } from "../src";

const MOCK = {
  id: 1,
  text: "some-text",
  array: ["element-1", "element-2"],
  empty_array: [],
  null_value: null,
  array_of_objects: [
    { some: { value: "value" } },
    { some: { value: "value" } },
  ],
  invalid_array_of_objects: [
    { some: { value: "value" } },
    { some: { other: "value" } },
  ],
  date: new Date().toISOString(),
  boolean: false,
  some: {
    nested: {
      value: "test",
      array: [{ type: "a" }, { type: "b" }],
    },
  },
};

describe("PostgrestFilter", () => {
  it("should create from query", () => {
    expect(
      PostgrestFilter.fromQuery(
        new PostgrestParser(
          createClient("https://localhost", "test")
            .from("contact")
            .select("username")
            .eq("username", "test")
        ).queryKey
      ).apply({ username: "test" })
    ).toEqual(true);
  });

  describe(".transform", () => {
    it("should transform correctly", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: "some_other_path",
                  alias: "text",
                  negate: false,
                  operator: "eq",
                  value: "some-text",
                },
              ],
            },
          ],
          paths: [
            { path: "text", declaration: "text", alias: "alias" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).transform(MOCK)
      ).toEqual({
        array: ["element-1", "element-2"],
        some: {
          nested: {
            value: "test",
          },
        },
        alias: "some-text",
      });
    });
  });

  describe(".hasPaths", () => {
    it("with null value for object", () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            { path: "null_value.value", declaration: "null_value.value" },
          ],
        }).hasPaths(MOCK)
      ).toEqual(true);
    });

    it("with empty array", () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            { path: "empty_array.value", declaration: "empty_array.value" },
          ],
        }).hasPaths(MOCK)
      ).toEqual(true);
    });

    it("with valid array of objects with json path", () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            {
              path: "array_of_objects.some->>value",
              declaration: "array_of_objects.some->>value",
            },
          ],
        }).hasPaths(MOCK)
      ).toEqual(true);
    });

    it("with valid array of objects", () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            {
              path: "array_of_objects.some.value",
              declaration: "array_of_objects.some.value",
            },
          ],
        }).hasPaths(MOCK)
      ).toEqual(true);
    });

    it("with invalid array of objects", () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            {
              path: "invalid_array_of_objects.some.value",
              declaration: "invalid_array_of_objects.some.value",
            },
          ],
        }).hasPaths(MOCK)
      ).toEqual(false);
    });
  });
  describe(".apply", () => {
    it("with alias", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: "some_other_path",
                  alias: "text",
                  negate: false,
                  operator: "eq",
                  value: "some-text",
                },
              ],
            },
          ],
          paths: [
            { path: "text", declaration: "text" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("or", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: "id",
                  negate: false,
                  operator: "eq",
                  value: 5,
                },
                {
                  path: "id",
                  negate: false,
                  operator: "eq",
                  value: 1,
                },
              ],
            },
          ],
          paths: [
            { path: "text", declaration: "text" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("or with nested value and undefined path", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: "cities.name",
                  negate: false,
                  operator: "eq",
                  value: "Paris",
                },
                {
                  path: "some.nested.value",
                  negate: false,
                  operator: "eq",
                  value: "t",
                },
                {
                  path: "some.nested.value",
                  negate: false,
                  operator: "eq",
                  value: "test",
                },
              ],
            },
          ],
          paths: [
            { path: "text", declaration: "text" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("or with nested and", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: "id",
                  negate: false,
                  operator: "eq",
                  value: 20,
                },
                {
                  and: [
                    {
                      path: "text",
                      negate: false,
                      operator: "eq",
                      value: "some-text",
                    },
                    {
                      path: "id",
                      negate: false,
                      operator: "eq",
                      value: 1,
                    },
                  ],
                },
              ],
            },
          ],
          paths: [
            { path: "text", declaration: "text" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("negate", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "id",
              negate: true,
              operator: "eq",
              value: 123,
            },
          ],
          paths: [
            { path: "text", declaration: "text" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });

    it("array values", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "text",
              negate: false,
              operator: "in",
              value: "(element-1,some-text,element-3)",
            },
          ],
          paths: [
            { path: "text", declaration: "text" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("boolean values", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "boolean",
              negate: false,
              operator: "is",
              value: false,
            },
          ],
          paths: [
            { path: "text", declaration: "text" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });

    it("json operator", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "some->nested->>value",
              negate: false,
              operator: "eq",
              value: "test",
            },
          ],
          paths: [
            { path: "text", declaration: "text" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });

    it("date values", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "date",
              negate: false,
              operator: "lt",
              value: new Date(),
            },
          ],
          paths: [
            { path: "text", declaration: "text" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("should return false if selected value is not present", () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            { path: "does_not_exist", declaration: "does_not_exist" },
            { path: "array", declaration: "array" },
            { path: "some.nested.value", declaration: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(false);
    });

    it("should throw if operator is not supported", () => {
      expect.assertions(1);
      try {
        new PostgrestFilter({
          filters: [
            {
              path: "test",
              negate: false,
              operator: "unknown" as any,
              value: "value",
            },
          ],
          paths: [],
        }).apply(MOCK);
      } catch (err) {
        expect(err).toEqual(
          Error(
            `Unable to build filter function for ${JSON.stringify({
              path: "test",
              negate: false,
              operator: "unknown",
              value: "value",
            })}. Operator unknown is not supported.`
          )
        );
      }
    });
  });
});
