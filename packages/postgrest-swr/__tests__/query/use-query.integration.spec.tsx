import { screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "@supabase-cache-helpers/shared";

describe("useQuery", () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;

  beforeAll(async () => {
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from("contact").delete().ilike("username", "test%");
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
          .eq("username", "psteinroe"),
        "single",
        { revalidateOnFocus: false }
      );
      return <div>{data?.username}</div>;
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("psteinroe");
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith("postgrest"))
    ).toBeDefined();
  });

  it("should work for maybeSingle", async () => {
    function Page() {
      const { data, isValidating } = useQuery(
        client
          .from("contact")
          .select("id,username")
          .eq("username", "psteinroe"),
        "maybeSingle"
      );
      return (
        <div>{isValidating ? "validating" : `username: ${data?.username}`}</div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("username: undefined");
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith("postgrest"))
    ).toBeDefined();
  });

  it("should work with multiple", async () => {
    function Page() {
      const { data, count, isValidating, mutate, error } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .eq("username", "psteinroe"),
        "multiple",
        { revalidateOnFocus: false }
      );
      return (
        <div>
          <div>
            {(data ?? []).find((d) => d.username === "psteinroe")?.username}
          </div>
          <div data-testId="count">{count}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("psteinroe");
    expect(screen.getByTestId("count").textContent).toEqual("1");
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith("postgrest"))
    ).toBeDefined();
  });
});
