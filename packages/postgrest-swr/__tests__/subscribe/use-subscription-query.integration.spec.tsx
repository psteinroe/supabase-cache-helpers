import { act, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSubscriptionQuery, useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";

describe("useSubscriptionQuery", () => {
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
    function Page() {
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username,has_low_ticket_number,ticket_number", {
            count: "exact",
          })
          .eq("username", USERNAME_1),
        "multiple",
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );

      const { status } = useSubscriptionQuery(
        client,
        `public:contact:username=eq.${USERNAME_1}`,
        {
          event: "*",
          table: "contact",
          schema: "public",
        },
        "id,username,has_low_ticket_number,ticket_number",
        ["id"]
      );

      return (
        <div>
          {(data ?? []).map((d) => (
            <span
              key={d.id}
            >{`ticket_number: ${d.ticket_number} | has_low_ticket_number: ${d.has_low_ticket_number}`}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="status">{status}</span>
        </div>
      );
    }

    const { unmount } = renderWithConfig(<Page />, {
      provider: () => provider,
    });
    await screen.findByText("count: 0", {}, { timeout: 10000 });
    await screen.findByText("SUBSCRIBED", {}, { timeout: 10000 });
    await act(async () => {
      await client
        .from("contact")
        .insert({ username: USERNAME_1, ticket_number: 1 })
        .select("*")
        .throwOnError()
        .single();
    });
    await screen.findByText(
      "ticket_number: 1 | has_low_ticket_number: true",
      {},
      { timeout: 10000 }
    );
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    await act(async () => {
      await client
        .from("contact")
        .update({ ticket_number: 1000 })
        .eq("username", USERNAME_1)
        .throwOnError();
    });
    await screen.findByText(
      "ticket_number: 1000 | has_low_ticket_number: false",
      {},
      { timeout: 10000 }
    );
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    unmount();
  }, 20000);
});
