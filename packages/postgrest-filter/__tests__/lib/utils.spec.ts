import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { parseOrderByKey, PostgrestParser } from "../../src";

describe("utils", () => {
  let c: SupabaseClient;

  beforeAll(() => {
    c = createClient("https://localhost", "1234");
  });

  describe("parseOrderByKey", () => {
    it("should parse forth and bock correctly", () => {
      const parser = new PostgrestParser(
        c
          .from("test")
          .select("*", { head: true, count: "exact" })
          .eq("id", "123")
          .order("one", {
            ascending: true,
            foreignTable: "foreignTable",
            nullsFirst: false,
          })
          .order("two", { ascending: false, nullsFirst: true })
      );
      expect(parseOrderByKey(parser.orderByKey)).toEqual(parser.orderBy);
    });
  });
});
