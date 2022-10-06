import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import "./utils";

import { buildInsertFetcher } from "../src";

const TEST_PREFIX = "postgrest-fetcher-insert-";
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
  it("should support insert one", async () => {
    await expect(
      buildInsertFetcher(
        client.from("contact"),
        "single"
      )({ username: `${testRunPrefix}-username-1` })
    ).resolves.toMatchObject({ username: `${testRunPrefix}-username-1` });
  });

  it("should support insert many", async () => {
    await expect(
      buildInsertFetcher(
        client.from("contact"),
        "multiple"
      )([
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
        "single",
        "username"
      )({ username: `${testRunPrefix}-username-1` })
    ).resolves.toEqual({ username: `${testRunPrefix}-username-1` });
  });
});
