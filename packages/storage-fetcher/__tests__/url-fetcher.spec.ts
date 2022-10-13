import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { upload, cleanup } from "./utils";

import { createUrlFetcher } from "../src";

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

  it("should return undefined if ensureExistence is set and file does not exist", async () => {
    await expect(
      createUrlFetcher("public", { ensureExistence: true })(
        client.storage.from("public_contact_files"),
        "unknown"
      )
    ).resolves.toBeUndefined();
  });

  it("should append updated_at to url ensureExistence is set and file exists", async () => {
    await expect(
      createUrlFetcher("public", { ensureExistence: true })(
        client.storage.from("public_contact_files"),
        `${dirName}/${publicFiles[0]}`
      )
    ).resolves.toEqual(
      expect.stringContaining(
        `http://localhost:54321/storage/v1/object/public/public_contact_files/${dirName}/${publicFiles[0]}?updated_at=`
      )
    );
  });
  it("should return url for public bucket", async () => {
    await expect(
      createUrlFetcher("public")(
        client.storage.from("public_contact_files"),
        `${dirName}/${publicFiles[0]}`
      )
    ).resolves.toEqual(
      `http://localhost:54321/storage/v1/object/public/public_contact_files/${dirName}/${publicFiles[0]}`
    );
  });

  it("should return url for private bucket", async () => {
    await expect(
      createUrlFetcher("private")(
        client.storage.from("private_contact_files"),
        `${dirName}/${privateFiles[0]}`
      )
    ).resolves.toEqual(
      expect.stringContaining(
        `http://localhost:54321/storage/v1/object/sign/private_contact_files/${dirName}/${privateFiles[0]}?token=`
      )
    );
  });

  it("should pass expires in for private bucket", async () => {
    await expect(
      createUrlFetcher("private", { expiresIn: 10 })(
        client.storage.from("private_contact_files"),
        `${dirName}/${privateFiles[0]}`
      )
    ).resolves.toEqual(
      expect.stringContaining(
        `http://localhost:54321/storage/v1/object/sign/private_contact_files/${dirName}/${privateFiles[0]}?token=`
      )
    );
  });

  it("should bubble up error", async () => {
    expect.assertions(1);
    const mock = {
      createSignedUrl: jest.fn().mockImplementationOnce(() => {
        return { error: { name: "StorageError", message: "Unknown Error" } };
      }),
    };
    try {
      await createUrlFetcher("private")(mock as any, "123");
    } catch (e) {
      expect(e).toEqual({ message: "Unknown Error", name: "StorageError" });
    }
  });
});
