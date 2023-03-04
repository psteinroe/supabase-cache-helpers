import { fireEvent, screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useDeleteMutation, useQuery } from "../../src";
import { renderWithConfig } from "../utils";
import type { Database } from "../database.types";
import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";

const TEST_PREFIX = "postgrest-swr-delete";

describe("useDeleteMutation", () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;

  let contacts: Database["public"]["Tables"]["contact"]["Row"][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
  });

  beforeEach(async () => {
    await client.from("contact").delete().ilike("username", `${TEST_PREFIX}%`);

    const { data } = await client
      .from("contact")
      .insert(
        new Array(3)
          .fill(0)
          .map((idx) => ({ username: `${testRunPrefix}-${idx}` }))
      )
      .select("*");
    contacts = data as Database["public"]["Tables"]["contact"]["Row"][];
  });

  it("should delete existing cache item and reduce count", async () => {
    const queryClient = new QueryClient();
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .eq("username", contacts[0].username)
      );
      const { mutateAsync: deleteContact } = useDeleteMutation(
        client.from("contact"),
        ["id"],
        null,
        { onSuccess: () => setSuccess(true) }
      );
      const { mutateAsync: deleteWithEmptyOptions } = useDeleteMutation(
        client.from("contact"),
        ["id"],
        null,
        {}
      );
      const { mutateAsync: deleteWithoutOptions } = useDeleteMutation(
        client.from("contact"),
        ["id"]
      );
      return (
        <div>
          <div
            data-testid="delete"
            onClick={async () =>
              await deleteContact({
                id: (data ?? []).find((c) => c)?.id,
              })
            }
          />
          <div
            data-testid="deleteWithEmptyOptions"
            onClick={async () =>
              await deleteWithEmptyOptions({
                id: (data ?? []).find((c) => c)?.id,
              })
            }
          />
          <div
            data-testid="deleteWithoutOptions"
            onClick={async () =>
              await deleteWithoutOptions({
                id: (data ?? []).find((c) => c)?.id,
              })
            }
          />
          {(data ?? []).map((d) => (
            <span key={d.id}>{d.username}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText(
      `count: ${contacts.length}`,
      {},
      { timeout: 10000 }
    );
    fireEvent.click(screen.getByTestId("deleteWithEmptyOptions"));
    await screen.findByText(
      `count: ${contacts.length - 1}`,
      {},
      { timeout: 10000 }
    );
    fireEvent.click(screen.getByTestId("deleteWithoutOptions"));
    await screen.findByText(
      `count: ${contacts.length - 2}`,
      {},
      { timeout: 10000 }
    );
    fireEvent.click(screen.getByTestId("delete"));
    await screen.findByText("success: true", {}, { timeout: 10000 });
    await screen.findByText(
      `count: ${contacts.length - 3}`,
      {},
      { timeout: 10000 }
    );
  });
});
