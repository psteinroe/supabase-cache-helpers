import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useInsertMutation, useQuery, useUpdateMutation } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "@supabase-cache-helpers/shared";

describe("useUpdateMutation", () => {
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
    const USERNAME_2 = `${USERNAME}-2`;
    function Page() {
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .in("username", [USERNAME, USERNAME_2]),
        "multiple",
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );
      const [insert] = useInsertMutation(client.from("contact"));
      const [update] = useUpdateMutation(client.from("contact"), ["id"]);
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert({ username: USERNAME })}
          />
          <div
            data-testid="update"
            onClick={async () =>
              await update({
                id: (data ?? []).find((d) => d.username === USERNAME)?.id,
                username: USERNAME_2,
              })
            }
          />
          <span>
            {
              data?.find((d) =>
                [USERNAME, USERNAME_2].includes(d.username ?? "")
              )?.username
            }
          </span>
          <span data-testid="count">{`count: ${count}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("count: 0", {});
    fireEvent.click(screen.getByTestId("insert"));
    await screen.findByText(USERNAME);
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    fireEvent.click(screen.getByTestId("update"));
    await screen.findByText(USERNAME_2);
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
  });
});
