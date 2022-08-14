import { createClient } from "@supabase/supabase-js";

import { parse } from "../src";

type Test = {
  id: string;
};

const c = createClient("http://localhost", "my-key");

describe("parse", () => {
  it("should throw if query is not an instance of PostgrestFilterBuilder", () => {
    expect.assertions(1);
    try {
      parse<Test>({ someObject: "test" } as any);
    } catch (e: any) {
      expect(e.toString()).toEqual(
        "Error: fb is not an instance of PostgrestFilterBuilder"
      );
    }
  });
  it("should return the same key if filters were applied in different orders", () => {
    expect(
      parse<Test>(
        c.from("test").select("*").eq("id", "123").contains("id", "456")
      )
    ).toEqual(
      parse<Test>(
        c.from("test").select("*").contains("id", "456").eq("id", "123")
      )
    );
  });
  it("should return only the relevant part of the url", () => {
    expect(
      parse<Test>(
        c.from("test").select("*").eq("id", "123").contains("id", "456")
      )
    ).toEqual({
      count: null,
      isHead: false,
      query: "id=cs.456&id=eq.123&select=*",
      schema: "default",
      table: "test",
    });
  });
  it("should set head and count", () => {
    expect(
      parse<Test>(
        c
          .from("test")
          .select("*", { head: true, count: "exact" })
          .eq("id", "123")
          .contains("id", "456")
      )
    ).toEqual({
      count: "exact",
      isHead: true,
      query: "id=cs.456&id=eq.123&select=*",
      schema: "default",
      table: "test",
    });
  });
  it("should work with rpcs", () => {
    expect(
      parse<Test>(
        c
          .rpc("my_rpc", { param: 123, test: { object: "test" } })
          .eq("id", "123")
          .contains("id", "456")
      )
    ).toEqual({
      count: null,
      isHead: false,
      query:
        "id=cs.456&id=eq.123&param=123&test=%7B%22object%22%3A%22test%22%7D",
      schema: "default",
      table: "rpc/my_rpc",
    });
  });
  it("should work with rpcs and head", () => {
    expect(
      parse<Test>(
        c
          .rpc("my_rpc", { param: 123 }, { head: true })
          .eq("id", "123")
          .contains("id", "456")
      )
    ).toEqual({
      count: null,
      isHead: true,
      query: "id=cs.456&id=eq.123&param=123",
      schema: "default",
      table: "rpc/my_rpc",
    });
  });
});
