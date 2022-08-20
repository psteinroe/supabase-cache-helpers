import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useInfiniteScrollQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";

describe("useInfiniteScrollQuery", () => {
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

  it("should load correctly", async () => {
    function Page() {
      const { data, loadMore, isValidating, error } = useInfiniteScrollQuery(
        client
          .from("contact")
          .select("id,username")
          .not("username", "ilike", "%test%")
          .order("username", { ascending: true }),
        { pageSize: 1 }
      );
      return (
        <div>
          {loadMore && (
            <div data-testid="loadMore" onClick={() => loadMore()} />
          )}
          <div data-testid="list">
            {(data ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("kiwicopple");
    const list = screen.getByTestId("list");
    expect(list.childElementCount).toEqual(1);

    fireEvent.click(screen.getByTestId("loadMore"));
    await screen.findByText("psteinroe");

    expect(list.childElementCount).toEqual(2);

    fireEvent.click(screen.getByTestId("loadMore"));
    await screen.findByText("thorwebdev");

    expect(list.childElementCount).toEqual(3);
  });
});
