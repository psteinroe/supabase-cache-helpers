import { createClient } from "@supabase/supabase-js";

import { getTable } from "../../src/lib/get-table";

const c = createClient("http://localhost:3000", "test");

describe("getTable", () => {
  it("should return table name", () => {
    expect(getTable(c.from("test").select("id").eq("id", 1))).toEqual("test");
  });
});
