import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useInsertMutation, useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";

const TEST_PREFIX = "postgrest-swr-insert";

describe("useInsertMutation", () => {
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

  it("should insert into existing cache item", async () => {
    const USERNAME_1 = `${testRunPrefix}-1`;
    const USERNAME_2 = `${testRunPrefix}-2`;
    const USERNAME_3 = `${testRunPrefix}-3`;
    function Page() {
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .in("username", [USERNAME_1, USERNAME_2, USERNAME_3]),
        "multiple",
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );
      const [insertOne] = useInsertMutation(client.from("contact"), "single");
      const [insertMany] = useInsertMutation(
        client.from("contact"),
        "multiple",
        "id,username"
      );

      return (
        <div>
          <div
            data-testid="insertOne"
            onClick={async () => await insertOne({ username: USERNAME_1 })}
          />
          <div
            data-testid="insertMany"
            onClick={async () =>
              await insertMany([
                {
                  username: USERNAME_2,
                },
                {
                  username: USERNAME_3,
                },
              ])
            }
          />
          {(data ?? []).map((d) => (
            <span key={d.id}>{d.username}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("count: 0", {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId("insertOne"));
    await screen.findByText(USERNAME_1, {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    fireEvent.click(screen.getByTestId("insertMany"));
    await screen.findByText(USERNAME_2, {}, { timeout: 10000 });
    await screen.findByText(USERNAME_3, {}, { timeout: 10000 });
    expect(screen.getByTestId("count").textContent).toEqual("count: 3");
  }, 20000);
});
