import { act, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSubscription, useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";
import { useState } from "react";

const TEST_PREFIX = "postgrest-swr-subscription-query";

describe("useSubscription", () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from("contact").delete().ilike("username", `${TEST_PREFIX}%`);
  });

  beforeEach(() => {
    provider = new Map();
  });

  it("should properly update cache", async () => {
    const USERNAME_1 = `${testRunPrefix}-1`;
    function Page() {
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username,ticket_number", { count: "exact" })
          .eq("username", USERNAME_1),
        "multiple",
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );

      const [cbCalled, setCbCalled] = useState<boolean>(false);

      const { status } = useSubscription(
        client.channel("#random"),
        {
          event: "*",
          table: "contact",
          schema: "public",
          filter: `username=eq.${USERNAME_1}`,
        },
        ["id"],
        { callback: () => setCbCalled(true) }
      );

      return (
        <div>
          {(data ?? []).map((d) => (
            <span key={d.id}>{`ticket_number: ${d.ticket_number}`}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="status">{status}</span>
          <span data-testid="callback-called">{`cbCalled: ${cbCalled}`}</span>
        </div>
      );
    }

    const { unmount } = renderWithConfig(<Page />, {
      provider: () => provider,
    });
    await screen.findByText("count: 0", {}, { timeout: 10000 });
    await screen.findByText("SUBSCRIBED", {}, { timeout: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await act(async () => {
      await client
        .from("contact")
        .insert({ username: USERNAME_1, ticket_number: 1 })
        .select("id")
        .throwOnError()
        .single();
    });
    await screen.findByText("ticket_number: 1", {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    await act(async () => {
      await client
        .from("contact")
        .update({ ticket_number: 5 })
        .eq("username", USERNAME_1)
        .throwOnError();
    });
    await screen.findByText("ticket_number: 5", {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    await screen.findByText("cbCalled: true", {}, { timeout: 10000 });
    unmount();
  });
});
