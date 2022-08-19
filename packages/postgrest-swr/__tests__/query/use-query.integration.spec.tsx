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

  it("should write the queried data to cache using the correct key", async () => {
    function Page() {
      const { data } = useQuery(
        client
          .from("contact")
          .select("id,username")
          .eq("username", "psteinroe"),
        "single"
      );
      return <div>{data?.username}</div>;
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("psteinroe");
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith("postgrest"))
    ).toBeDefined();
  });
});
