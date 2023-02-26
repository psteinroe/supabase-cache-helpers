import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import "./utils";

import { buildUpdateFetcher } from "../src";

const TEST_PREFIX = "postgrest-fetcher-update-";

describe("update", () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contact: Database["public"]["Tables"]["contact"]["Row"] | null;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from("contact").delete().ilike("username", `${TEST_PREFIX}%`);

    const { data } = await client
      .from("contact")
      .insert({ username: `${testRunPrefix}-username-1` })
      .select("*")
      .throwOnError()
      .single();
    contact = data;
    expect(contact).toBeDefined();
  });

  it("should throw if input does not have a value for all primary keys", async () => {
    await expect(
      buildUpdateFetcher(client.from("contact"), ["id"], {
        queriesForTable: () => [],
      })({})
    ).rejects.toThrowError("Missing value for primary key id");
  });

  it("should update entity by primary keys", async () => {
    const updatedContact = await buildUpdateFetcher(
      client.from("contact"),
      ["id"],
      { queriesForTable: () => [] }
    )({
      id: contact?.id,
      username: `${testRunPrefix}-username-2`,
    });
    expect(updatedContact).toEqual(null);
    const { data } = await client
      .from("contact")
      .select("*")
      .eq("id", contact?.id)
      .throwOnError()
      .maybeSingle();
    expect(data?.username).toEqual(`${testRunPrefix}-username-2`);
  });

  it("should apply query if provided", async () => {
    const updatedContact = await buildUpdateFetcher(
      client.from("contact"),
      ["id"],
      { query: "username", queriesForTable: () => [] }
    )({
      id: contact?.id,
      username: `${testRunPrefix}-username-3`,
    });
    expect(updatedContact).toEqual({
      username: `${testRunPrefix}-username-3`,
    });
  });
});
