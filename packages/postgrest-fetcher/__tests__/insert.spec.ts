import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { buildInsertFetcher } from "../src";
import { Database } from "./database.types";
import "./utils";

const TEST_PREFIX = "postgrest-fetcher-insert";
describe("insert", () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from("contact").delete().ilike("username", `${TEST_PREFIX}%`);
  });

  it("should support insert many", async () => {
    await expect(
      buildInsertFetcher(client.from("contact"))([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
      ])
    ).resolves.toMatchObject([
      { username: `${testRunPrefix}-username-1` },
      { username: `${testRunPrefix}-username-2` },
    ]);
  });

  it("should support passing a query", async () => {
    await expect(
      buildInsertFetcher(
        client.from("contact"),
        "username"
      )([{ username: `${testRunPrefix}-username-1` }])
    ).resolves.toEqual([{ username: `${testRunPrefix}-username-1` }]);
  });
});
