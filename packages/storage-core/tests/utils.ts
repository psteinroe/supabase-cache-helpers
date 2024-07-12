import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

export const loadFixtures = async () => {
  const fixturesDir = resolve(__dirname, '__fixtures__');
  const fileNames = await readdir(fixturesDir);
  return {
    fileNames,
    files: await Promise.all(
      fileNames.map(async (f) => await readFile(join(fixturesDir, f))),
    ),
  };
};

export const upload = async (
  client: SupabaseClient<unknown>,
  bucketName: string,
  dirName: string,
): Promise<string[]> => {
  const fixturesDir = resolve(__dirname, '__fixtures__');
  const fileNames = await readdir(fixturesDir);
  await Promise.all(
    fileNames.map(
      async (f) =>
        await client.storage
          .from(bucketName)
          .upload(`${dirName}/${f}`, await readFile(join(fixturesDir, f))),
    ),
  );
  return fileNames;
};

export const cleanup = async (
  client: SupabaseClient<unknown>,
  bucketName: string,
  dirName: string,
) => {
  const { data } = await client.storage.from(bucketName).list(dirName);
  await client.storage
    .from(bucketName)
    .remove((data ?? []).map((d) => `${dirName}/${d.name}`));
};
