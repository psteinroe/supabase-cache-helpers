import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen } from "@testing-library/react";
import React, { useState } from "react";

import { useQuery, useUpsertMutation } from "../../src";
import type { Database } from "../database.types";
import { renderWithConfig } from "../utils";

const TEST_PREFIX = "postgrest-react-query-upsert";

describe("useUpsertMutation", () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from("contact").delete().ilike("username", `${TEST_PREFIX}%`);
  });

  it("should upsert into existing cache item", async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-2`;
    const USERNAME_2 = `${testRunPrefix}-3`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username,golden_ticket", { count: "exact" })
          .in("username", [USERNAME_1, USERNAME_2]),
      );

      const { mutateAsync: upsert } = useUpsertMutation(
        client.from("contact"),
        ["id"],
        null,
        {
          onSuccess: () => setSuccess(true),
        },
      );

      return (
        <div>
          <div
            data-testid="upsertMany"
            onClick={async () =>
              await upsert([
                {
                  id: data?.find((d) => d.username === USERNAME_1)?.id,
                  username: USERNAME_1,
                  golden_ticket: true,
                },
                {
                  id: "cae53d23-51a8-4408-9f40-05c83a4b0bbd",
                  username: USERNAME_2,
                  golden_ticket: null,
                },
              ])
            }
          />
          {(data ?? []).map((d) => (
            <span
              key={d.id}
            >{`${d.username} - ${d.golden_ticket ?? "null"}`}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    await client
      .from("contact")
      .insert({
        username: USERNAME_1,
        golden_ticket: true,
      })
      .throwOnError();
    renderWithConfig(<Page />, queryClient);
    await screen.findByText("count: 1", {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId("upsertMany"));
    await screen.findByText(`${USERNAME_1} - true`, {}, { timeout: 10000 });
    await screen.findByText(`${USERNAME_2} - null`, {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 2");
    await screen.findByText("success: true", {}, { timeout: 10000 });
  });
});
