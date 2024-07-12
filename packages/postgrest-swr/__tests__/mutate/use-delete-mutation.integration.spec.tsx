import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { fireEvent, screen } from "@testing-library/react";
import React, { useState } from "react";

import { useDeleteMutation, useQuery } from "../../src";
import type { Database } from "../database.types";
import { renderWithConfig } from "../utils";

const TEST_PREFIX = "postgrest-swr-delete";

describe("useDeleteMutation", () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;
  let testRunNumber: number;

  let contacts: Database["public"]["Tables"]["contact"]["Row"][];
  let multiPks: Database["public"]["Tables"]["multi_pk"]["Row"][];

  beforeAll(async () => {
    testRunNumber = Math.floor(Math.random() * 100);
    testRunPrefix = `${TEST_PREFIX}-${testRunNumber}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
  });

  beforeEach(async () => {
    provider = new Map();

    await client.from("contact").delete().ilike("username", `${TEST_PREFIX}%`);

    const { data } = await client
      .from("contact")
      .insert(
        new Array<number>(3)
          .fill(0)
          .map((_, idx) => ({ username: `${testRunPrefix}-${idx}` })),
      )
      .select("*");
    contacts = data as Database["public"]["Tables"]["contact"]["Row"][];

    await client.from("multi_pk").delete().ilike("name", `${TEST_PREFIX}%`);

    const input = new Array<number>(3).fill(0).map((_, idx) => ({
      id_1: testRunNumber + idx,
      id_2: testRunNumber + idx,
      name: `${testRunPrefix}-${idx}`,
    }));

    const { data: multiPksResult } = await client
      .from("multi_pk")
      .insert(input)
      .select("*")
      .throwOnError();

    multiPks =
      multiPksResult as Database["public"]["Tables"]["multi_pk"]["Row"][];
  });

  it("should delete existing cache item and reduce count", async () => {
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .ilike("username", `${testRunPrefix}%`),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );
      const { trigger: deleteContact } = useDeleteMutation(
        client.from("contact"),
        ["id"],
        "id",
        {
          onSuccess: () => setSuccess(true),
        },
      );
      const { trigger: deleteWithEmptyOptions } = useDeleteMutation(
        client.from("contact"),
        ["id"],
        null,
        {},
      );
      const { trigger: deleteWithoutOptions } = useDeleteMutation(
        client.from("contact"),
        ["id"],
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

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText(
      `count: ${contacts.length}`,
      {},
      { timeout: 10000 },
    );
    fireEvent.click(screen.getByTestId("deleteWithEmptyOptions"));
    await screen.findByText(
      `count: ${contacts.length - 1}`,
      {},
      { timeout: 10000 },
    );
    fireEvent.click(screen.getByTestId("deleteWithoutOptions"));
    await screen.findByText(
      `count: ${contacts.length - 2}`,
      {},
      { timeout: 10000 },
    );
    fireEvent.click(screen.getByTestId("delete"));
    await screen.findByText("success: true", {}, { timeout: 10000 });
    await screen.findByText(
      `count: ${contacts.length - 3}`,
      {},
      { timeout: 10000 },
    );
  });

  it("should batch delete", async () => {
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const [error, setError] = useState<boolean>(false);

      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .ilike("username", `${testRunPrefix}%`),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );

      const { trigger: deleteContact } = useDeleteMutation(
        client.from("contact"),
        ["id"],
        null,
        {
          onSuccess: () => setSuccess(true),
          onError: (e) => {
            setError(true);
          },
        },
      );

      return (
        <div>
          <div
            data-testid="batchDelete"
            onClick={async () => {
              for (const contact of contacts ?? []) {
                await deleteContact({
                  id: contact.id,
                });
              }
            }}
          />
          {(data ?? []).map((d) => (
            <span key={d.id}>{d.username}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
          <span data-testid="error">{`error: ${error}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    await screen.findByText(
      `count: ${contacts.length}`,
      {},
      { timeout: 10000 },
    );

    fireEvent.click(screen.getByTestId("batchDelete"));

    await screen.findByText(`count: 0`, {}, { timeout: 10000 });
    await screen.findByText("success: true", {}, { timeout: 10000 });
    await screen.findByText("error: false", {}, { timeout: 10000 });
  });

  it("should batch delete with multi pks", async () => {
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const [error, setError] = useState<boolean>(false);

      const { data, count } = useQuery(
        client
          .from("multi_pk")
          .select("id_1,id_2,name", { count: "exact" })
          .ilike("name", `${testRunPrefix}%`),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );

      const { trigger: deleteMultiPk } = useDeleteMutation(
        client.from("multi_pk"),
        ["id_1", "id_2"],
        null,
        {
          onSuccess: () => setSuccess(true),
          onError: (e) => {
            console.error(e);
            setError(true);
          },
        },
      );

      return (
        <div>
          <div
            data-testid="batchDelete"
            onClick={async () => {
              for (const i of multiPks ?? []) {
                await deleteMultiPk({
                  id_1: i.id_1,
                  id_2: i.id_2,
                });
              }
            }}
          />
          {(data ?? []).map((d) => (
            <span key={[d.id_1, d.id_2].join(",")}>{d.name}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
          <span data-testid="error">{`error: ${error}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });

    await screen.findByText(
      `count: ${contacts.length}`,
      {},
      { timeout: 10000 },
    );

    fireEvent.click(screen.getByTestId("batchDelete"));

    await screen.findByText(`count: 0`, {}, { timeout: 10000 });
    await screen.findByText("success: true", {}, { timeout: 10000 });
    await screen.findByText("error: false", {}, { timeout: 10000 });
  });
});
