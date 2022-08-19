import { act, fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "../../src";
import { renderWithConfig, Contact } from "../utils";

describe("useQuery", () => {
  let client: SupabaseClient;
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
          .from<Contact>("contact")
          .select(
            "id,created_at,username,ticket_number,golden_ticket,tags,age_range,hello:metadata->>hello,catchphrase,country!inner(code,mapped_name:name,full_name)"
          )
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
