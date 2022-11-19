import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useInfiniteScrollQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";
import { useState } from "react";

const TEST_PREFIX = "postgrest-swr-infinite-scroll";

describe("useInfiniteScrollQuery", () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;
  let contacts: Database["public"]["Tables"]["contact"]["Row"][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from("contact").delete().ilike("username", `${TEST_PREFIX}%`);

    const { data } = await client
      .from("contact")
      .insert([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ])
      .select("*")
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
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
          .ilike("username", `${testRunPrefix}%`)
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
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 }
    );
    const list = screen.getByTestId("list");
    expect(list.childElementCount).toEqual(1);

    fireEvent.click(screen.getByTestId("loadMore"));
    await screen.findByText(
      `${testRunPrefix}-username-2`,
      {},
      { timeout: 10000 }
    );

    expect(list.childElementCount).toEqual(2);

    fireEvent.click(screen.getByTestId("loadMore"));
    await screen.findByText(
      `${testRunPrefix}-username-3`,
      {},
      { timeout: 10000 }
    );

    expect(list.childElementCount).toEqual(3);
  });
  it("should allow conditional queries", async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { data, isLoading } = useInfiniteScrollQuery(
        condition
          ? client
              .from("contact")
              .select("id,username")
              .ilike("username", `${testRunPrefix}%`)
              .order("username", { ascending: true })
          : null,
        { pageSize: 1 }
      );
      return (
        <div>
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="pages">
            {(data ?? [])[0]?.username ?? "undefined"}
          </div>
          <div>{`isLoading: ${isLoading}`}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("isLoading: false", {}, { timeout: 10000 });
    await screen.findByText("undefined", {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId("setCondition"));
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 }
    );
  });
});
