import { screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "@supabase-cache-helpers/shared";

describe("useQuery", () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;

  beforeAll(() => {
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
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
    console.log(
      Array.from(provider.keys()).find((k) => k.startsWith("postgrest"))
    );
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith("postgrest"))
    ).toBeDefined();
  });
});
