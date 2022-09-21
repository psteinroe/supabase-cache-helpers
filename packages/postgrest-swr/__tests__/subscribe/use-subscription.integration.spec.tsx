import { act, screen } from "@testing-library/react";
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
      "https://tpglnprdiwhaocbeffuf.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZ2xucHJkaXdoYW9jYmVmZnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjM3OTAzNzMsImV4cCI6MTk3OTM2NjM3M30.JtvepauxJtyW5GRwEuVPP1jhmkCcCxMKLU90lSYyYsE"
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

      const { status } = useSubscription(
        client.channel("random"),
        {
          event: "*",
          table: "contact",
          schema: "public",
        },
        ["id"]
      );

      return (
        <div>
          {(data ?? []).map((d) => (
            <span key={d.id}>{d.username}</span>
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
    const { data: contact } = await client
      .from("contact")
      .insert({ username: USERNAME_1 })
      .select("id")
      .throwOnError()
      .single();
    await screen.findByText(USERNAME_1, {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    await client
      .from("contact")
      .update({ username: USERNAME_2 })
      .eq("id", contact?.id)
      .throwOnError();
    await screen.findByText(USERNAME_2, {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    unmount();
  }, 20000);
});
