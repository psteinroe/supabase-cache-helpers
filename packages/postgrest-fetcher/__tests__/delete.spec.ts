import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import "./utils";

import { buildDeleteFetcher } from "../src";

const TEST_PREFIX = "postgrest-fetcher-delete-";

describe("delete", () => {
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
  it("should throw if input does not have a value for all primary keys", async () => {
    await expect(
      buildDeleteFetcher(client.from("contact"), ["id"])({})
    ).rejects.toThrowError("Missing value for primary key id");
  });

  it("should delete entity by primary keys", async () => {
    const { data: contact } = await client
      .from("contact")
      .insert({ username: `${testRunPrefix}-test` })
      .select("id")
      .throwOnError()
      .single();
    expect(contact?.id).toBeDefined();
    const deletedContact = await buildDeleteFetcher(client.from("contact"), [
      "id",
    ])({
      id: contact?.id,
    });
    expect(deletedContact).toMatchObject({ username: `${testRunPrefix}-test` });
    const { data } = await client
      .from("contact")
      .select("*")
      .eq("id", contact?.id)
      .throwOnError()
      .maybeSingle();
    expect(data).toEqual(undefined);
  });

  it("should apply query if provided", async () => {
    const { data: contact } = await client
      .from("contact")
      .insert({ username: `${testRunPrefix}-test`, ticket_number: 1234 })
      .select("id")
      .throwOnError()
      .single();
    expect(contact?.id).toBeDefined();
    const deletedContact = await buildDeleteFetcher(
      client.from("contact"),
      ["id"],
      "ticket_number"
    )({
      id: contact?.id,
    });
    expect(deletedContact).toEqual({ ticket_number: 1234 });
  });
});
