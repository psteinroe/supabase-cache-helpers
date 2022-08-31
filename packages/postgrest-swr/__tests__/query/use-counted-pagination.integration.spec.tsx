import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useCountedPagination, useInfiniteQuery, useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";

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
            .not("username", "ilike", "%test%")
            .order("username", { ascending: true }),
          "multiple"
        ),
        dataQuery: useInfiniteQuery(
          client
            .from("contact")
            .select("id,username")
            .not("username", "ilike", "%test%")
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
          <div data-testid="pageCount">{`pageCount: ${pageCount}`}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("kiwicopple", {}, { timeout: 10000 });
    await screen.findByText("pageCount: 3", {}, { timeout: 10000 });
    const currentPageList = screen.getByTestId("currentPage");
    expect(currentPageList.childElementCount).toEqual(1);
    expect(screen.getByTestId("pageIndex").textContent).toEqual("0");
    expect(screen.getByTestId("pageCount").textContent).toEqual("pageCount: 3");
    const pagesList = screen.getByTestId("pages");
    expect(pagesList.childElementCount).toEqual(1);

    fireEvent.click(screen.getByTestId("nextPage"));
    await screen.findByText("psteinroe", {}, { timeout: 10000 });

    await screen.findByTestId("previousPage", {}, { timeout: 10000 });
    expect(currentPageList.childElementCount).toEqual(1);
    expect(pagesList.childElementCount).toEqual(2);
    expect(screen.getByTestId("pageIndex").textContent).toEqual("1");

    fireEvent.click(screen.getByTestId("nextPage"));
    await screen.findByText("thorwebdev", {}, { timeout: 10000 });

    expect(currentPageList.childElementCount).toEqual(1);
    expect(pagesList.childElementCount).toEqual(3);
    expect(screen.getByTestId("pageIndex").textContent).toEqual("2");

    fireEvent.click(screen.getByTestId("goToPageZero"));
    await screen.findByText("kiwicopple", {}, { timeout: 10000 });
    expect(screen.getByTestId("pageIndex").textContent).toEqual("0");
  }, 20000);
});
