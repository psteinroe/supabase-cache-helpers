import { SupabaseClient, createClient } from "@supabase/supabase-js";

import { PostgrestParser } from "../src";

describe("PostgrestParser", () => {
  let c: SupabaseClient;

  beforeAll(() => {
    c = createClient("https://localhost", "1234");
  });

  it("head", () => {
    expect(
      new PostgrestParser(
        c
          .from("test")
          .select("*", { head: true, count: "exact" })
          .eq("id", "123")
          .contains("id", "456")
      ).isHead
    ).toEqual(true);
  });

  it("count", () => {
    expect(
      new PostgrestParser(
        c
          .from("test")
          .select("*", { head: true, count: "exact" })
          .eq("id", "123")
          .contains("id", "456")
      ).count
    ).toEqual("exact");
  });

  it("limit & offset", () => {
    const parser = new PostgrestParser(
      c
        .from("test")
        .select("*", { head: true, count: "exact" })
        .eq("id", "123")
        .contains("id", "456")
        .range(100, 999)
    );
    expect(parser.limit).toEqual(900);
    expect(parser.offset).toEqual(100);
  });

  describe("order by", () => {
    it("should parse nullsFirst", () => {
      const parser = new PostgrestParser(
        c
          .from("test")
          .select("*", { head: true, count: "exact" })
          .eq("id", "123")
          .order("one", { nullsFirst: true, ascending: false })
      );
      expect(parser.orderBy).toEqual([
        {
          column: "one",
          ascending: false,
          foreignTable: undefined,
          nullsFirst: true,
        },
      ]);
    });
    it("should parse foreign table option", () => {
      const parser = new PostgrestParser(
        c
          .from("test")
          .select("*", { head: true, count: "exact" })
          .eq("id", "123")
          .order("one", { foreignTable: "test" })
      );
      expect(parser.orderBy).toEqual([
        {
          column: "one",
          ascending: true,
          foreignTable: "test",
          nullsFirst: false,
        },
      ]);
    });
    it("should parse ascending option", () => {
      const parser = new PostgrestParser(
        c
          .from("test")
          .select("*", { head: true, count: "exact" })
          .eq("id", "123")
          .order("one", { ascending: true })
          .order("two", { ascending: false })
      );
      expect(parser.orderBy).toEqual([
        {
          column: "one",
          ascending: true,
          foreignTable: undefined,
          nullsFirst: false,
        },
        {
          column: "two",
          ascending: false,
          foreignTable: undefined,
          nullsFirst: false,
        },
      ]);
    });

    it("should generate key correctly", () => {
      expect(
        new PostgrestParser(
          c
            .from("test")
            .select("*", { head: true, count: "exact" })
            .eq("id", "123")
            .order("one", { ascending: true, foreignTable: "foreignTable" })
            .order("two", { ascending: false })
        ).orderByKey
      ).toEqual("foreignTable.one:asc.nullsLast|two:desc.nullsLast");
    });
  });
  describe("table", () => {
    it("should set table", () => {
      expect(
        new PostgrestParser(
          c.from("test").select("*").eq("id", "123").contains("id", "456")
        ).table
      ).toEqual("test");
    });
    it("should work with rpc", () => {
      expect(
        new PostgrestParser(
          c
            .rpc("my_rpc", { param: 123, test: { object: "test" } })
            .eq("id", "123")
            .contains("id", "456")
        ).table
      ).toEqual("rpc/my_rpc");
    });
  });

  it("schema", () => {
    expect(
      new PostgrestParser(
        createClient("http://localhost", "123", { db: { schema: "test" } })
          .rpc("my_rpc", { param: 123, test: { object: "test" } })
          .eq("id", "123")
          .contains("id", "456")
      ).schema
    ).toEqual("test");
  });

  describe("bodyKey", () => {
    it("should encode the body correctly", () => {
      expect(
        new PostgrestParser(
          c.rpc("test", {
            some: { nested: "value", another: 1 },
            another: "value",
          })
        ).bodyKey
      ).toEqual("another=value&some.another=1&some.nested=value");
    });

    it("should return the same key if bodies contain keys in different order", () => {
      expect(
        new PostgrestParser(
          c.rpc("test", {
            some: { nested: "value", another: 1 },
            another: "value",
          })
        ).bodyKey
      ).toEqual(
        new PostgrestParser(
          c.rpc("test", {
            another: "value",
            some: { another: 1, nested: "value" },
          })
        ).bodyKey
      );
    });
  });

  describe("queryKey", () => {
    it("should return the same key if filters were applied in different orders", () => {
      expect(
        new PostgrestParser(
          c.from("test").select("*").eq("id", "123").contains("id", "456")
        ).queryKey
      ).toEqual(
        new PostgrestParser(
          c.from("test").select("*").contains("id", "456").eq("id", "123")
        ).queryKey
      );
    });
    it("should return only the relevant part of the url", () => {
      expect(
        new PostgrestParser(
          c.from("test").select("*").eq("id", "123").contains("id", "456")
        ).queryKey
      ).toEqual("id=cs.456&id=eq.123&select=*");
    });
  });
  describe(".paths", () => {
    it("should work with nested alias", () => {
      expect(
        new PostgrestParser(
          c
            .from("test")
            .select(
              "id,test:some_column,relation(value,aliased_relation:other_relation(other_value))"
            )
        ).paths
      ).toEqual([
        { declaration: "id", alias: undefined, path: "id" },
        {
          declaration: "test:some_column",
          alias: "test",
          path: "some_column",
        },
        {
          declaration: "relation.value",
          alias: undefined,
          path: "relation.value",
        },
        {
          declaration: "relation.aliased_relation:other_relation.other_value",
          alias: "relation.aliased_relation.other_value",
          path: "relation.other_relation.other_value",
        },
      ]);
    });
    it("should return empty array if select is not defined", () => {
      const query = c.from("test").insert({});
      expect(new PostgrestParser(query).paths).toEqual([]);
    });
    it("should extract nested paths correctly", () => {
      const query = c.from("test").select(`
        name,
        city:cities (
          test:name
        ),
        countries (
          capital,
          population,
          some_ref (
            test:first,
            second
          )
        ),
        alias:test (prop),
        prop2,
        prop3
  `);

      expect(new PostgrestParser(query).paths).toEqual([
        { alias: undefined, path: "name", declaration: "name" },
        { alias: undefined, path: "prop2", declaration: "prop2" },
        { alias: undefined, path: "prop3", declaration: "prop3" },
        {
          alias: "city.test",
          path: "cities.name",
          declaration: "city:cities.test:name",
        },
        {
          alias: undefined,
          path: "countries.capital",
          declaration: "countries.capital",
        },
        {
          alias: undefined,
          path: "countries.population",
          declaration: "countries.population",
        },
        {
          alias: "countries.some_ref.test",
          path: "countries.some_ref.first",
          declaration: "countries.some_ref.test:first",
        },
        {
          alias: undefined,
          path: "countries.some_ref.second",
          declaration: "countries.some_ref.second",
        },
        {
          alias: "alias.prop",
          path: "test.prop",
          declaration: "alias:test.prop",
        },
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
        new PostgrestParser(query).paths;
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

      expect(new PostgrestParser(query).paths).toEqual([
        { alias: undefined, path: "name", declaration: "name" },
        {
          alias: "organisation.test",
          path: "organisation_id.name",
          declaration: "organisation:organisation_id.test:name",
        },
      ]);
    });

    it("should work for inner join and hint", () => {
      const query = c.from("test").select(`
    name,
    alias:organisation!contact_organisation_id_fkey!inner (
      test:name
    )
  `);

      expect(new PostgrestParser(query).paths).toEqual([
        {
          alias: undefined,
          path: "name",
          declaration: "name",
        },
        {
          alias: "alias.test",
          path: "organisation.name",
          declaration:
            "alias:organisation!contact_organisation_id_fkey!inner.test:name",
        },
      ]);
    });

    it("should work for json operators", () => {
      expect.assertions(1);
      const query = c.from("test").select(`
    field:name -> nested
  `);

      expect(new PostgrestParser(query).paths).toEqual([
        {
          alias: "field",
          path: "name->nested",
          declaration: "field:name->nested",
        },
      ]);
    });
  });

  describe(".filters", () => {
    let query: any;

    beforeEach(() => {
      query = c
        .from("test")
        .select(
          "id,test:some_column,relation(value,aliased_relation:other_relation(other_value))"
        );
    });

    it("negated filter on embeddings with dot in value", () => {
      expect(
        new PostgrestParser(
          query.not(
            "relation.other_relation.other_value",
            "eq",
            "some.value.with.dots"
          )
        ).filters
      ).toEqual([
        {
          path: "relation.other_relation.other_value",
          negate: true,
          alias: "relation.aliased_relation.other_value",
          operator: "eq",
          value: "some.value.with.dots",
        },
      ]);
    });

    it("negated filter on embeddings", () => {
      expect(
        new PostgrestParser(query.not("relation.value", "eq", "filterValue"))
          .filters
      ).toEqual([
        {
          path: "relation.value",
          negate: true,
          alias: undefined,
          operator: "eq",
          value: "filterValue",
        },
      ]);
    });

    it("filter on embeddings", () => {
      expect(
        new PostgrestParser(query.eq("relation.value", "filterValue")).filters
      ).toEqual([
        {
          path: "relation.value",
          negate: false,
          alias: undefined,
          operator: "eq",
          value: "filterValue",
        },
      ]);
    });

    it("or", () => {
      expect(
        new PostgrestParser(query.or("id.eq.123,id.gte.456")).filters
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

    it("with alias", () => {
      expect(
        new PostgrestParser(query.or("id.eq.123,id.gte.456,some_column.eq.123"))
          .filters
      ).toEqual([
        {
          or: [
            {
              alias: undefined,
              path: "id",
              negate: false,
              operator: "eq",
              value: 123,
            },
            {
              alias: undefined,
              path: "id",
              negate: false,
              operator: "gte",
              value: 456,
            },
            {
              path: "some_column",
              alias: "test",
              negate: false,
              operator: "eq",
              value: 123,
            },
          ],
        },
      ]);
    });
    it("or with foreignTable", () => {
      expect(
        new PostgrestParser(
          query.or("name.eq.Wellington,name.eq.Paris", {
            foreignTable: "cities",
          })
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
        new PostgrestParser(
          query.or(
            "full_name.eq.20,test.neq.true,and(full_name.eq.Test Name,email.eq.test@mail.com)"
          )
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
        new PostgrestParser(
          query
            .or(
              "full_name.eq.20,and(full_name.eq.Test Name,email.eq.test@mail.com)"
            )
            .order("full_name", { ascending: true, nullsFirst: true })
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
        new PostgrestParser(
          query.or("id.gt.20,and(name.eq.New Zealand,name.eq.France)", {
            foreignTable: "cities",
          })
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
      expect(new PostgrestParser(query.eq("id", "123")).filters).toEqual([
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
        new PostgrestParser(
          query.eq("id -> nested -> moreNested ->> test", "123")
        ).filters
      ).toEqual([
        {
          path: "id->nested->moreNested->>test",
          negate: false,
          operator: "eq",
          value: 123,
        },
      ]);
    });
    it("json selector with mapped name", () => {
      expect(
        new PostgrestParser(
          query.eq("id -> nested -> moreNested ->> test", "123")
        ).filters
      ).toEqual([
        {
          path: "id->nested->moreNested->>test",
          negate: false,
          operator: "eq",
          value: 123,
        },
      ]);
    });
    it("not", () => {
      expect(new PostgrestParser(query.not("id", "eq", "123")).filters).toEqual(
        [
          {
            path: "id",
            negate: true,
            operator: "eq",
            value: 123,
          },
        ]
      );
    });
    it("neq", () => {
      expect(new PostgrestParser(query.neq("id", "456")).filters).toEqual([
        {
          path: "id",
          negate: false,
          operator: "neq",
          value: 456,
        },
      ]);
    });
    it("gt", () => {
      expect(new PostgrestParser(query.gt("id", 5)).filters).toEqual([
        {
          path: "id",
          negate: false,
          operator: "gt",
          value: 5,
        },
      ]);
    });
    it("gte", () => {
      expect(new PostgrestParser(query.gte("id", 5)).filters).toEqual([
        {
          path: "id",
          negate: false,
          operator: "gte",
          value: 5,
        },
      ]);
    });
    it("lt", () => {
      expect(new PostgrestParser(query.lt("id", 5)).filters).toEqual([
        {
          path: "id",
          negate: false,
          operator: "lt",
          value: 5,
        },
      ]);
    });
    it("lte", () => {
      expect(new PostgrestParser(query.lte("id", 5)).filters).toEqual([
        {
          path: "id",
          negate: false,
          operator: "lte",
          value: 5,
        },
      ]);
    });
    it("like", () => {
      expect(new PostgrestParser(query.like("id", "%TEST%")).filters).toEqual([
        {
          path: "id",
          negate: false,
          operator: "like",
          value: "%TEST%",
        },
      ]);
    });
    it("ilike", () => {
      expect(new PostgrestParser(query.ilike("id", "%TEST%")).filters).toEqual([
        {
          path: "id",
          negate: false,
          operator: "ilike",
          value: "%TEST%",
        },
      ]);
    });
    it("is", () => {
      expect(new PostgrestParser(query.is("id", true)).filters).toEqual([
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
        new PostgrestParser(
          query.textSearch("text_search_column", "search value")
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
        new PostgrestParser(
          query.textSearch("column", "te me", { type: "plain" })
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
        new PostgrestParser(query.in("id", ["test1", "test2"])).filters
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
        new PostgrestParser(query.contains("id", ["test1", "test2"])).filters
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
        new PostgrestParser(query.containedBy("id", ["test1", "test2"])).filters
      ).toEqual([
        {
          path: "id",
          negate: false,
          operator: "cd",
          value: "{test1,test2}",
        },
      ]);
    });

    it("should work with exclusive paths and empty and filter", () => {
      expect(
        new PostgrestParser(
          query.or("eq.20,and(unknown.eq.Test Name,email.eq.test@mail.com)"),
          { exclusivePaths: ["full_name"] }
        ).filters
      ).toEqual([]);
    });

    it("should work with exclusive paths and empty or filter", () => {
      expect(
        new PostgrestParser(
          query.or("or(unknown.eq.Test Name,email.eq.test@mail.com)"),
          { exclusivePaths: ["full_name"] }
        ).filters
      ).toEqual([]);
    });

    it("should respect includePaths option", () => {
      expect(
        new PostgrestParser(
          query.or(
            "full_name.eq.20,and(full_name.eq.Test Name,email.eq.test@mail.com)"
          ),
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
});
