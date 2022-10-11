import { SupabaseClient } from "@supabase/supabase-js";

import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

import * as dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../../../.env.local") });

export const upload = async (
  client: SupabaseClient<unknown>,
  bucketName: string,
  dirName: string
): Promise<string[]> => {
  const fixturesDir = resolve(__dirname, "__fixtures__");
  const files = await readdir(fixturesDir);
  await Promise.all(
    files.map(
      async (f) =>
        await client.storage
          .from(bucketName)
          .upload(`${dirName}/${f}`, await readFile(join(fixturesDir, f)))
    )
  );
  return files;
};

export const cleanup = async (
  client: SupabaseClient<unknown>,
  bucketName: string,
  dirName: string
) => {
  const { data } = await client.storage.from(bucketName).list(dirName);
  await client.storage
    .from(bucketName)
    .remove((data ?? []).map((d) => `${dirName}/${d.name}`));
};
