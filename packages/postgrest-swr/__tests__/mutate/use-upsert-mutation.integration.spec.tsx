import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useQuery, useUpsertMutation } from "../../src";
import { renderWithConfig, Contact } from "../utils";

describe("useUpsertMutation", () => {
  let client: SupabaseClient;
  let provider: Map<any, any>;
  let testId: number;

  beforeAll(() => {
    testId = Math.floor(Math.random() * 10000);
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    client.from("contact").delete().ilike("username", "test%");
  });

  beforeEach(() => {
    provider = new Map();
  });

  it("should upsert into existing cache item", async () => {
    const USERNAME = `test-${testId}`;
    const USERNAME_2 = `${USERNAME}-2`;
    function Page() {
      const { data, count } = useQuery(
        client
          .from<Contact>("contact")
          .select("id,username,golden_ticket", { count: "exact" })
          .in("username", [USERNAME, USERNAME_2]),
        "multiple",
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );
      const [upsertOne] = useUpsertMutation(
        client.from<Contact>("contact"),
        "single",
        ["id"]
      );
      const [upsertMany] = useUpsertMutation(
        client.from<Contact>("contact"),
        "multiple",
        ["id"]
      );
      return (
        <div>
          <div
            data-testid="upsertOne"
            onClick={async () => await upsertOne({ username: USERNAME })}
          />
          <div
            data-testid="upsertMany"
            onClick={async () =>
              await upsertMany([
                {
                  id: data?.find((d) => d.username === USERNAME)?.id,
                  username: USERNAME,
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
            <span key={d.id}>
              {`${d.username} - ${d.golden_ticket ?? "null"}`}
            </span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("count: 0", {});
    fireEvent.click(screen.getByTestId("upsertOne"));
    await screen.findByText(`${USERNAME} - null`);
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    fireEvent.click(screen.getByTestId("upsertMany"));
    await screen.findByText(`${USERNAME} - true`, {}, { timeout: 100000 });
    await screen.findByText(`${USERNAME}-2 - null`);
  });
});
