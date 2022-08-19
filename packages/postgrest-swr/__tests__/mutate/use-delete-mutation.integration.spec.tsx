import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useInsertMutation, useDeleteMutation, useQuery } from "../../src";
import { renderWithConfig, Contact } from "../utils";

describe("useDeleteMutation", () => {
  let client: SupabaseClient;
  let provider: Map<any, any>;
  let testId: number;

  beforeAll(() => {
    testId = Math.floor(Math.random() * 100);
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
  });

  beforeEach(() => {
    provider = new Map();
  });

  it("should insert into existing cache item", async () => {
    const USERNAME = `test-${testId}`;
    function Page() {
      const { data, count } = useQuery(
        client
          .from<Contact>("contact")
          .select("id,username", { count: "exact" })
          .eq("username", USERNAME),
        "multiple",
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );
      const [insert] = useInsertMutation(client.from<Contact>("contact"));
      const [deleteContact] = useDeleteMutation(
        client.from<Contact>("contact"),
        ["id"]
      );
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert({ username: USERNAME })}
          />
          <div
            data-testid="delete"
            onClick={async () =>
              await deleteContact({
                id: data?.find((d) => d.username === USERNAME)?.id,
              })
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
    await screen.findByText("count: 0", {});
    fireEvent.click(screen.getByTestId("insert"));
    await screen.findByText(USERNAME);
    expect(screen.getByTestId("count").textContent).toEqual("count: 1");
    fireEvent.click(screen.getByTestId("delete"));
    await screen.findByText("count: 0");
  });
});
