import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import { upload, cleanup } from "./utils";

import { createURLFetcher } from "../src/url-fetcher";
import { StorageKey } from "../src/types";

const TEST_PREFIX = "storage-fetcher-directory";

describe("urlFetcher", () => {
  let client: SupabaseClient<unknown>;
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

  afterAll(async () => {
    await Promise.all([
      cleanup(client, "public_contact_files", dirName),
      cleanup(client, "private_contact_files", dirName),
    ]);
  });

  it("should throw if key not valid", async () => {
    await expect(
      createURLFetcher("private")([
        client.storage.from("private_contact_files"),
        "123",
        414,
      ] as unknown as StorageKey)
    ).rejects.toThrowError("Invalid StorageKey");
  });

  it("should return undefined if ensureExistence is set and file does not exist", async () => {
    await expect(
      createURLFetcher("public", { ensureExistence: true })([
        client.storage.from("public_contact_files"),
        "unknown",
      ])
    ).resolves.toBeUndefined();
  });

  it("should return url for public bucket", async () => {
    await expect(
      createURLFetcher("public")([
        client.storage.from("public_contact_files"),
        `${dirName}/${publicFiles[0]}`,
      ])
    ).resolves.toEqual(
      "http://localhost:54321/storage/v1/object/public/public_contact_files/1.jpg"
    );
  });

  it("should return url for private bucket", async () => {
    await expect(
      createURLFetcher("private")([
        client.storage.from("private_contact_files"),
        `${dirName}/${privateFiles[0]}`,
      ])
    ).resolves.toEqual(
      expect.stringContaining(
        `http://localhost:54321/storage/v1/object/sign/private_contact_files/${dirName}/${privateFiles[0]}?token=`
      )
    );
  });
});
