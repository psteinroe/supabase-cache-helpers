import { screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSubscription, useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";

describe("useSubscription", () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testId: number;

  beforeAll(async () => {
    testId = Math.floor(Math.random() * 100);
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client
      .from("contact")
      .delete()
      .ilike("username", "subscription-test%");
  });

  beforeEach(() => {
    provider = new Map();
  });

  it("should insert into existing cache item", async () => {
    const USERNAME_1 = `subscription-test-1-${testId}`;
    const USERNAME_2 = `subscription-test-2-${testId}`;
    function Page() {
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .in("username", [USERNAME_1, USERNAME_2]),
        "multiple",
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );
      useSubscription(
        client.channel("random"),
        { event: "INSERT", table: "contact", schema: "public" },
        ["id"]
      );

      return (
        <div>
          {(data ?? []).map((d) => (
            <span key={d.id}>{d.username}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("count: 0", {}, { timeout: 10000 });
    await client
      .from("contact")
      .insert({ username: USERNAME_1 })
      .throwOnError();
    await screen.findByText(USERNAME_1, {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    await client
      .from("contact")
      .insert({ username: USERNAME_2 })
      .throwOnError();
    await screen.findByText(USERNAME_2, {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 2");
  }, 20000);
});
