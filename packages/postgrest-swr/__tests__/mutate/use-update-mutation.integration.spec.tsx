import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";

import { useInsertMutation, useQuery, useUpdateMutation } from "../../src";
import type { Database } from "../database.types";
import { renderWithConfig } from "../utils";

const TEST_PREFIX = "postgrest-swr-update";

describe("useUpdateMutation", () => {
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

  it("should update existing cache item", async () => {
    const USERNAME_1 = `${testRunPrefix}-2`;
    const USERNAME_2 = `${testRunPrefix}-3`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .in("username", [USERNAME_1, USERNAME_2]),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );
      const [insert] = useInsertMutation(client.from("contact"), ["id"]);
      const [update] = useUpdateMutation(client.from("contact"), ["id"], null, {
        onSuccess: () => setSuccess(true),
      });
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert([{ username: USERNAME_1 }])}
          />
          <div
            data-testid="update"
            onClick={async () =>
              await update({
                id: (data ?? []).find((d) => d.username === USERNAME_1)?.id,
                username: USERNAME_2,
              })
            }
          />
          <span>
            {
              data?.find((d) =>
                [USERNAME_1, USERNAME_2].includes(d.username ?? "")
              )?.username
            }
          </span>
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("count: 0", {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId("insert"));
    await screen.findByText(USERNAME_1, {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    fireEvent.click(screen.getByTestId("update"));
    await screen.findByText(USERNAME_2, {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    await screen.findByText("success: true", {}, { timeout: 10000 });
  });
});
