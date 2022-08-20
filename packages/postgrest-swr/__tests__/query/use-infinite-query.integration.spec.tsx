import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useInfiniteQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";

describe("useInfiniteQuery", () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;

  beforeAll(async () => {
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from("contact").delete().ilike("username", "test%");
  });

  beforeEach(() => {
    provider = new Map();
  });

  it("should behave like the SWR infinite hook", async () => {
    function Page() {
      const { data, size, setSize, isValidating, error, mutate } =
        useInfiniteQuery(
          client
            .from("contact")
            .select("id,username")
            .not("username", "ilike", "%test%")
            .order("username", { ascending: true }),
          { pageSize: 1 }
        );
      return (
        <div>
          <div data-testid="setSizeTo3" onClick={() => setSize(3)} />
          <div data-testid="list">
            {(data ?? []).flat().map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="size">{size}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("kiwicopple");
    const list = screen.getByTestId("list");
    expect(list.childElementCount).toEqual(1);
    expect(screen.getByTestId("size").textContent).toEqual("1");

    fireEvent.click(screen.getByTestId("setSizeTo3"));

    await screen.findByText("psteinroe");
    await screen.findByText("thorwebdev");

    expect(list.childElementCount).toEqual(3);
    expect(screen.getByTestId("size").textContent).toEqual("3");
  });
});
