import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useInsertMutation, useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "@supabase-cache-helpers/shared";

describe("useInsertMutation", () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testId: number;

  beforeAll(async () => {
    testId = Math.floor(Math.random() * 100);
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from("contact").delete().ilike("username", "test%");
  });

  beforeEach(() => {
    provider = new Map();
  });

  it("should insert into existing cache item", async () => {
    const USERNAME = `test-${testId}`;
    function Page() {
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .eq("username", USERNAME),
        "multiple",
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );
      const [insert] = useInsertMutation(client.from("contact"));
      return (
        <div
          data-testid="insert"
          onClick={async () => await insert({ username: USERNAME })}
        >
          <span>{data?.find((d) => d.username === USERNAME)?.username}</span>
          <span data-testid="count">{`count: ${count}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("count: 0", {});
    fireEvent.click(screen.getByTestId("insert"));
    await screen.findByText(USERNAME);
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
  });
});
