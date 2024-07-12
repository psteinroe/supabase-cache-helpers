import { type SupabaseClient, createClient } from "@supabase/supabase-js";

import { findFilters } from "../../src/lib/find-filters";
import { PostgrestParser } from "../../src/postgrest-parser";

describe("findFilters", () => {
  let c: SupabaseClient;

  beforeAll(() => {
    c = createClient("https://localhost", "1234");
  });

  it("by path", () => {
    expect(
      findFilters(
        new PostgrestParser(
          c
            .from("test")
            .select("id", { head: true, count: "exact" })
            .eq("id", "123")
            .contains("id", "456"),
        ).filters,
        { path: "id" },
      ),
    ).toEqual([
      {
        alias: undefined,
        negate: false,
        operator: "eq",
        path: "id",
        value: 123,
      },
      {
        alias: undefined,
        negate: false,
        operator: "cs",
        path: "id",
        value: 456,
      },
    ]);
  });

  it("by alias", () => {
    expect(
      findFilters(
        new PostgrestParser(
          c
            .from("test")
            .select("test:id", { head: true, count: "exact" })
            .eq("id", "123")
            .contains("id", "456"),
        ).filters,
        { alias: "test" },
      ),
    ).toEqual([
      { alias: "test", negate: false, operator: "eq", path: "id", value: 123 },
      { alias: "test", negate: false, operator: "cs", path: "id", value: 456 },
    ]);
  });

  it("by operator", () => {
    expect(
      findFilters(
        new PostgrestParser(
          c
            .from("test")
            .select("id", { head: true, count: "exact" })
            .eq("id", "123")
            .contains("id", "456"),
        ).filters,
        { operator: "eq" },
      ),
    ).toEqual([
      {
        alias: undefined,
        negate: false,
        operator: "eq",
        path: "id",
        value: 123,
      },
    ]);
  });

  it("by negated operator", () => {
    expect(
      findFilters(
        new PostgrestParser(
          c
            .from("test")
            .select("id", { head: true, count: "exact" })
            .not("id", "eq", "123")
            .contains("id", "456"),
        ).filters,
        { negate: true, operator: "eq" },
      ),
    ).toEqual([
      {
        alias: undefined,
        negate: true,
        operator: "eq",
        path: "id",
        value: 123,
      },
    ]);
  });

  it("by value", () => {
    expect(
      findFilters(
        new PostgrestParser(
          c
            .from("test")
            .select("id", { head: true, count: "exact" })
            .neq("id", "123")
            .contains("id", "456"),
        ).filters,
        { value: 123 },
      ),
    ).toEqual([
      {
        alias: undefined,
        negate: false,
        operator: "neq",
        path: "id",
        value: 123,
      },
    ]);
  });
});
