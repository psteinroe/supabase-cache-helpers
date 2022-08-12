import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

import { PostgrestFilter } from "../src";

const MOCK = {
  id: 1,
  text: "some-text",
  array: ["element-1", "element-2"],
  date: new Date().toISOString(),
  boolean: false,
  some: {
    nested: {
      value: "test",
      array: [{ type: "a" }],
    },
  },
};

describe("PostgrestFilter", () => {
  let c: SupabaseClient;

  beforeAll(() => {
    c = createClient("https://localhost", "1234");
  });
  describe(".paths", () => {
    it("should extract nested paths correctly", () => {
      const query = c.from("test").select(`
        name,
        cities (
          name
        ),
        countries (
          capital,
          population,
          some_ref (
            first,
            second
          )
        ),
        test (prop),
        prop2,
        prop3
  `);

      expect(new PostgrestFilter(query["url"].searchParams).paths).toEqual([
        "name",
        "prop2",
        "prop3",
        "cities.name",
        "countries.capital",
        "countries.population",
        "countries.some_ref.first",
        "countries.some_ref.second",
        "test.prop",
      ]);
    });

    it("should throw if wildcard is used", () => {
      expect.assertions(1);
      const query = c.from("test").select(`
    name,
    cities (
      name
    ),
    countries (
      capital,
      population
      some_ref (
        *
      )
    ),
    test (prop)
    ,prop2,prop3
  `);

      try {
        new PostgrestFilter(query["url"].searchParams).paths;
      } catch (e) {
        expect(e).toEqual(Error("Wildcard selector is not supported"));
      }
    });

    it("should work for mapped names", () => {
      expect.assertions(1);
      const query = c.from("test").select(`
    name,
    organisation:organisation_id (
      test:name
    )
  `);

      expect(new PostgrestFilter(query["url"].searchParams).paths).toEqual([
        "name",
        "organisation.test",
      ]);
    });

    it("should work for inner joins", () => {
      expect.assertions(1);
      const query = c.from("test").select(`
    name,
    organisation!contact_organisation_id_fkey (
      test:name
    )
  `);

      expect(new PostgrestFilter(query["url"].searchParams).paths).toEqual([
        "name",
        "organisation.test",
      ]);
    });
  });

  describe(".filters", () => {
    let query: any;

    beforeEach(() => {
      query = c.from<any>("test").select("*");
    });

    it("or", () => {
      expect(
        new PostgrestFilter(
          query.or("id.eq.123,id.gte.456")["url"].searchParams
        ).filters
      ).toEqual([
        {
          or: [
            {
              path: "id",
              negate: false,
              operator: "eq",
              value: 123,
            },
            {
              path: "id",
              negate: false,
              operator: "gte",
              value: 456,
            },
          ],
        },
      ]);
    });
    it("or with foreignTable", () => {
      expect(
        new PostgrestFilter(
          query.or("name.eq.Wellington,name.eq.Paris", {
            foreignTable: "cities",
          })["url"].searchParams
        ).filters
      ).toEqual([
        {
          or: [
            {
              path: "cities.name",
              negate: false,
              operator: "eq",
              value: "Wellington",
            },
            {
              path: "cities.name",
              negate: false,
              operator: "eq",
              value: "Paris",
            },
          ],
        },
      ]);
    });
    it("or with nested and", () => {
      expect(
        new PostgrestFilter(
          query.or(
            "full_name.eq.20,test.neq.true,and(full_name.eq.Test Name,email.eq.test@mail.com)"
          )["url"].searchParams
        ).filters
      ).toEqual([
        {
          or: [
            {
              path: "full_name",
              operator: "eq",
              negate: false,
              value: 20,
            },
            {
              path: "test",
              operator: "neq",
              negate: false,
              value: true,
            },
            {
              and: [
                {
                  path: "full_name",
                  operator: "eq",
                  negate: false,
                  value: "Test Name",
                },
                {
                  path: "email",
                  operator: "eq",
                  negate: false,
                  value: "test@mail.com",
                },
              ],
            },
          ],
        },
      ]);
    });
    it("ignore order", () => {
      expect(
        new PostgrestFilter(
          query
            .or(
              "full_name.eq.20,and(full_name.eq.Test Name,email.eq.test@mail.com)"
            )
            .order("full_name", { ascending: true, nullsFirst: true })[
            "url"
          ].searchParams
        ).filters
      ).toEqual([
        {
          or: [
            {
              path: "full_name",
              operator: "eq",
              negate: false,
              value: 20,
            },
            {
              and: [
                {
                  path: "full_name",
                  operator: "eq",
                  negate: false,
                  value: "Test Name",
                },
                {
                  path: "email",
                  operator: "eq",
                  negate: false,
                  value: "test@mail.com",
                },
              ],
            },
          ],
        },
      ]);
    });
    it("or with foreignTable and nested and", () => {
      expect(
        new PostgrestFilter(
          query.or("id.gt.20,and(name.eq.New Zealand,name.eq.France)", {
            foreignTable: "cities",
          })["url"].searchParams
        ).filters
      ).toEqual([
        {
          or: [
            {
              path: "cities.id",
              negate: false,
              operator: "gt",
              value: 20,
            },
            {
              and: [
                {
                  path: "cities.name",
                  negate: false,
                  operator: "eq",
                  value: "New Zealand",
                },
                {
                  path: "cities.name",
                  negate: false,
                  operator: "eq",
                  value: "France",
                },
              ],
            },
          ],
        },
      ]);
    });
    it("eq", () => {
      expect(
        new PostgrestFilter(query.eq("id", "123")["url"].searchParams).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "eq",
          value: 123,
        },
      ]);
    });
    it("json selector", () => {
      expect(
        new PostgrestFilter(
          query.eq("id -> nested -> moreNested ->> test", "123")[
            "url"
          ].searchParams
        ).filters
      ).toEqual([
        {
          path: "id.nested.moreNested.test",
          negate: false,
          operator: "eq",
          value: 123,
        },
      ]);
    });
    it("not", () => {
      expect(
        new PostgrestFilter(query.not("id", "eq", "123")["url"].searchParams)
          .filters
      ).toEqual([
        {
          path: "id",
          negate: true,
          operator: "eq",
          value: 123,
        },
      ]);
    });
    it("neq", () => {
      expect(
        new PostgrestFilter(query.neq("id", "456")["url"].searchParams).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "neq",
          value: 456,
        },
      ]);
    });
    it("gt", () => {
      expect(
        new PostgrestFilter(query.gt("id", 5)["url"].searchParams).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "gt",
          value: 5,
        },
      ]);
    });
    it("gte", () => {
      expect(
        new PostgrestFilter(query.gte("id", 5)["url"].searchParams).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "gte",
          value: 5,
        },
      ]);
    });
    it("lt", () => {
      expect(
        new PostgrestFilter(query.lt("id", 5)["url"].searchParams).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "lt",
          value: 5,
        },
      ]);
    });
    it("lte", () => {
      expect(
        new PostgrestFilter(query.lte("id", 5)["url"].searchParams).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "lte",
          value: 5,
        },
      ]);
    });
    it("like", () => {
      expect(
        new PostgrestFilter(query.like("id", "%TEST%")["url"].searchParams)
          .filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "like",
          value: "%TEST%",
        },
      ]);
    });
    it("ilike", () => {
      expect(
        new PostgrestFilter(query.ilike("id", "%TEST%")["url"].searchParams)
          .filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "ilike",
          value: "%TEST%",
        },
      ]);
    });
    it("is", () => {
      expect(
        new PostgrestFilter(query.is("id", true)["url"].searchParams).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "is",
          value: true,
        },
      ]);
    });
    it("fts", () => {
      expect(
        new PostgrestFilter(
          query.textSearch("text_search_column", "search value")[
            "url"
          ].searchParams
        ).filters
      ).toEqual([
        {
          path: "text_search_column",
          negate: false,
          operator: "fts",
          value: "search value",
        },
      ]);
    });
    it("plfts", () => {
      expect(
        new PostgrestFilter(
          query.textSearch("column", "te me", { type: "plain" })[
            "url"
          ].searchParams
        ).filters
      ).toEqual([
        {
          path: "column",
          negate: false,
          operator: "plfts",
          value: "te me",
        },
      ]);
    });
    it("in", () => {
      expect(
        new PostgrestFilter(
          query.in("id", ["test1", "test2"])["url"].searchParams
        ).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "in",
          value: "(test1,test2)",
        },
      ]);
    });
    it("contains", () => {
      expect(
        new PostgrestFilter(
          query.contains("id", ["test1", "test2"])["url"].searchParams
        ).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "cs",
          value: "{test1,test2}",
        },
      ]);
    });
    it("containedBy", () => {
      expect(
        new PostgrestFilter(
          query.containedBy("id", ["test1", "test2"])["url"].searchParams
        ).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "cd",
          value: "{test1,test2}",
        },
      ]);
    });
    it("should respect includePaths option", () => {
      expect(
        new PostgrestFilter(
          query.or(
            "full_name.eq.20,and(full_name.eq.Test Name,email.eq.test@mail.com)"
          )["url"].searchParams,
          { exclusivePaths: ["full_name"] }
        ).filters
      ).toEqual([
        {
          or: [
            {
              path: "full_name",
              operator: "eq",
              negate: false,
              value: 20,
            },
            {
              and: [
                {
                  path: "full_name",
                  operator: "eq",
                  negate: false,
                  value: "Test Name",
                },
              ],
            },
          ],
        },
      ]);
    });
  });

  describe(".apply", () => {
    let query: PostgrestFilterBuilder<typeof MOCK>;
    beforeEach(() => {
      query = c
        .from<typeof MOCK>("test")
        .select("text,array,some(nested(value))");
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
          paths: ["text", "array", "some.nested.value"],
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
          paths: ["text", "array", "some.nested.value"],
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
          paths: ["text", "array", "some.nested.value"],
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
          paths: ["text", "array", "some.nested.value"],
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
          paths: ["text", "array", "some.nested.value"],
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
          paths: ["text", "array", "some.nested.value"],
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
          paths: ["text", "array", "some.nested.value"],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("should return false if selected value is not present", () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: ["does_not_exist", "array", "some.nested.value"],
        }).apply(MOCK)
      ).toEqual(false);
    });
  });
});
