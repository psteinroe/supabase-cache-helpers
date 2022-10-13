import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { upload, cleanup } from "./utils";

import { directoryFetcher } from "../src";

const TEST_PREFIX = "storage-fetcher-directory";

describe("directoryFetcher", () => {
  let client: SupabaseClient<unknown>;
  let dirName: string;
  let files: string[];

  beforeAll(async () => {
    dirName = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );

    await cleanup(client, "private_contact_files", dirName);
    files = await upload(client, "private_contact_files", dirName);
  });

  afterAll(async () => {
    await cleanup(client, "private_contact_files", dirName);
  });

  it("should bubble up error", async () => {
    expect.assertions(1);
    const mock = {
      list: jest.fn().mockImplementationOnce(() => {
        return { error: { name: "StorageError", message: "Unknown Error" } };
      }),
    };
    try {
      await directoryFetcher(mock as any, "123");
    } catch (e) {
      expect(e).toEqual({ message: "Unknown Error", name: "StorageError" });
    }
  });

  it("should return empty array if null is returned", async () => {
    const mock = {
      list: jest.fn().mockImplementationOnce(() => {
        return { data: null };
      }),
    };
    await expect(directoryFetcher(mock as any, "123")).resolves.toEqual([]);
  });

  it("should return files", async () => {
    await expect(
      directoryFetcher(client.storage.from("private_contact_files"), dirName)
    ).resolves.toEqual(
      expect.arrayContaining(
        files.map((f) => expect.objectContaining({ name: f }))
      )
    );
  });
});
