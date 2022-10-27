import { screen } from "@testing-library/react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useDirectory } from "../../src";
import { cleanup, renderWithConfig, upload } from "../utils";
import { Middleware } from "swr";

const TEST_PREFIX = "postgrest-storage-directory";

describe("useDirectory", () => {
  let client: SupabaseClient;
  let provider: Map<any, any>;
  let dirName: string;
  let privateFiles: string[];
  let publicFiles: string[];

  beforeAll(async () => {
    dirName = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );

    await Promise.all([
      cleanup(client, "public_contact_files", dirName),
      cleanup(client, "private_contact_files", dirName),
    ]);

    privateFiles = await upload(client, "private_contact_files", dirName);
    publicFiles = await upload(client, "public_contact_files", dirName);
  });
  beforeEach(() => {
    provider = new Map();
  });

  it("should not fail for null key", async () => {
    function Page() {
      const { data: url, isValidating } = useDirectory(
        client.storage.from("private_contact_files"),
        null,
        {
          revalidateOnFocus: false,
        }
      );
      return (
        <>
          <div>{`URL: ${url}`}</div>
          <div>{`isValidating: ${isValidating}`}</div>
        </>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText("isValidating: false", {}, { timeout: 10000 });
  });

  it("should return files", async () => {
    const mwMock = jest.fn();
    const mw: Middleware = (useSWRNext) => {
      return (key, fetcher, config) => {
        mwMock();
        const swr = useSWRNext(key, fetcher, config);
        return swr;
      };
    };
    function Page() {
      const { data: files } = useDirectory(
        client.storage.from("private_contact_files"),
        dirName,
        {
          revalidateOnFocus: false,
          use: [mw],
        }
      );
      return (
        <div>
          {(files ?? []).map((f) => (
            <span key={f.name}>{f.name}</span>
          ))}
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await Promise.all(
      privateFiles.map(
        async (f) => await screen.findByText(f, {}, { timeout: 10000 })
      )
    );
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith("storage"))
    ).toBeDefined();
    expect(mwMock).toHaveBeenCalled();
  });
});
