import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import "./utils";

import { createFetcher } from "../src";

const TEST_PREFIX = "postgrest-fetcher-fetch-";

describe("fetch", () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contacts: Database["public"]["Tables"]["contact"]["Row"][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from("contact").delete().ilike("username", `${TEST_PREFIX}%`);

    const { data } = await client
      .from("contact")
      .insert([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
      ])
      .select("*")
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(2);
  });

  it("should support single", async () => {
    await expect(
      createFetcher("single")(
        client
          .from("contact")
          .select("username", { count: "exact" })
          .eq("username", `${testRunPrefix}-username-1`)
      )
    ).resolves.toEqual({
      data: { username: `${testRunPrefix}-username-1` },
    });
  });

  it("should support maybeSingle", async () => {
    await expect(
      createFetcher("maybeSingle")(
        client.from("contact").select("username").eq("username", "unknown")
      )
    ).resolves.toEqual({ data: undefined });
  });

  it("should support multiple", async () => {
    await expect(
      createFetcher("multiple")(
        client
          .from("contact")
          .select("username", { count: "exact" })
          .ilike("username", `${testRunPrefix}-%`)
      )
    ).resolves.toEqual({
      data: [
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
      ],
      count: 2,
    });
  });
});
