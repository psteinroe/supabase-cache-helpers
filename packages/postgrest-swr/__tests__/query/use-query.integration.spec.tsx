import { screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";

const TEST_PREFIX = "postgrest-swr-query";

describe("useQuery", () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
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
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ])
      .select("*")
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });
  beforeEach(() => {
    provider = new Map();
  });

  it("should work for single", async () => {
    function Page() {
      const { data, isValidating, mutate, error } = useQuery(
        client
          .from("contact")
          .select("id,username")
          .eq("username", contacts[0].username),
        "single",
        { revalidateOnFocus: false }
      );
      return <div>{data?.username}</div>;
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 }
    );
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith("postgrest"))
    ).toBeDefined();
  }, 20000);

  it("should work for maybeSingle", async () => {
    function Page() {
      const { data, isValidating } = useQuery(
        client.from("contact").select("id,username").eq("username", "unknown"),
        "maybeSingle"
      );
      return (
        <div>{isValidating ? "validating" : `username: ${data?.username}`}</div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("username: undefined", {}, { timeout: 10000 });
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith("postgrest"))
    ).toBeDefined();
  }, 20000);

  it("should work with multiple", async () => {
    function Page() {
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .ilike("username", `${testRunPrefix}%`),
        "multiple",
        { revalidateOnFocus: false }
      );
      return (
        <div>
          <div>
            {
              (data ?? []).find((d) => d.username === contacts[0].username)
                ?.username
            }
          </div>
          <div data-testid="count">{count}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 }
    );
    expect(screen.getByTestId("count").textContent).toEqual("4");
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith("postgrest"))
    ).toBeDefined();
  }, 20000);
});
