import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useCountedPagination, useInfiniteQuery, useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "@supabase-cache-helpers/shared";

describe("useCountedPagination", () => {
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

  it("should paginate correctly", async () => {
    function Page() {
      const {
        currentPage,
        nextPage,
        previousPage,
        setPage,
        pages,
        pageIndex,
        pageCount,
      } = useCountedPagination({
        pageSize: 1,
        countQuery: useQuery(
          client
            .from("contact")
            .select("id,username", { count: "exact", head: true })
            .order("username", { ascending: true }),
          "multiple"
        ),
        dataQuery: useInfiniteQuery(
          client
            .from("contact")
            .select("id,username")
            .order("username", { ascending: true }),
          { pageSize: 1 }
        ),
      });
      return (
        <div>
          {nextPage && (
            <div data-testid="nextPage" onClick={() => nextPage()} />
          )}
          {previousPage && (
            <div data-testid="previousPage" onClick={() => previousPage()} />
          )}
          <div data-testid="goToPageZero" onClick={() => setPage(0)} />
          <div data-testid="currentPage">
            {(currentPage ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="pages">
            {(pages ?? []).flat().map((p) => (
              <div key={p.id}>{p.id}</div>
            ))}
          </div>
          <div data-testid="pageIndex">{pageIndex}</div>
          <div data-testid="pageCount">{pageCount}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("kiwicopple");
    const currentPageList = screen.getByTestId("currentPage");
    expect(currentPageList.childElementCount).toEqual(1);
    expect(screen.getByTestId("pageIndex").textContent).toEqual("0");
    expect(screen.getByTestId("pageCount").textContent).toEqual("3");
    const pagesList = screen.getByTestId("pages");
    expect(pagesList.childElementCount).toEqual(1);

    fireEvent.click(screen.getByTestId("nextPage"));
    await screen.findByText("psteinroe");

    await screen.findByTestId("previousPage");
    expect(currentPageList.childElementCount).toEqual(1);
    expect(pagesList.childElementCount).toEqual(2);
    expect(screen.getByTestId("pageIndex").textContent).toEqual("1");

    fireEvent.click(screen.getByTestId("nextPage"));
    await screen.findByText("thorwebdev");

    expect(currentPageList.childElementCount).toEqual(1);
    expect(pagesList.childElementCount).toEqual(3);
    expect(screen.getByTestId("pageIndex").textContent).toEqual("2");

    fireEvent.click(screen.getByTestId("goToPageZero"));
    await screen.findByText("kiwicopple");
    expect(screen.getByTestId("pageIndex").textContent).toEqual("0");
  });
});
