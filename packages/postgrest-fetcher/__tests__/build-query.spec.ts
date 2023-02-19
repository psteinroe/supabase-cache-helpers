import { PostgrestParser } from "@supabase-cache-helpers/postgrest-filter";
import { createClient } from "@supabase/supabase-js";

import { loadQuery } from "../src/build-query";

const c = createClient("https://localhost", "any");

describe("loadQuery", () => {
  it("should work without user query", () => {
    const q1 = c.from("contact").select("some,value").eq("test", "value");
    const q2 = c
      .from("contact")
      .select("some,other,value")
      .eq("another_test", "value");

    expect(
      loadQuery({
        parsersForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })
    ).toEqual("test,some,value,another_test,other");
  });

  it("should work", () => {
    const q1 = c.from("contact").select("some,value").eq("test", "value");
    const q2 = c
      .from("contact")
      .select("some,other,value")
      .eq("another_test", "value");

    expect(
      loadQuery({
        q: "something,the,user,queries",
        parsersForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })
    ).toEqual("something,the,user,queries,test,some,value,another_test,other");
  });

  it("should repect alias from user query", () => {
    const q1 = c.from("contact").select("some,value").eq("test", "value");
    const q2 = c
      .from("contact")
      .select("some,other,value")
      .eq("another_test", "value");

    expect(
      loadQuery({
        q: "something,the,user,queries,alias:value",
        parsersForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })
    ).toEqual(
      "something,the,user,queries,alias:value,test,some,another_test,other"
    );
  });

  it("should respect hints and inner joinv+ps", () => {
    const q1 = c.from("contact").select("some,value").eq("test", "value");
    const q2 = c
      .from("contact")
      .select(
        "some,other,alias:value,alias:relation!hint!inner(relation_value)"
      )
      .eq("another_test", "value");

    expect(
      loadQuery({
        q: "something,the,user,queries",
        parsersForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })
    ).toEqual(
      "something,the,user,queries,test,some,value,another_test,other,relation!hint!inner(relation_value)"
    );
  });

  it("should work with and or", () => {
    const q1 = c.from("contact").select("some,value").eq("test", "value");
    const q2 = c
      .from("contact")
      .select("some,other,value")
      .eq("another_test", "value")
      .or("some.eq.123,and(value.eq.342,other.gt.4)");

    expect(
      loadQuery({
        q: "something,the,user,queries",
        parsersForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })
    ).toEqual("something,the,user,queries,test,some,value,another_test,other");
  });
});
