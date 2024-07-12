import { type SupabaseClient, createClient } from '@supabase/supabase-js';

import { createDirectoryUrlsFetcher } from '../src/directory-urls-fetcher';
import { cleanup, upload } from './utils';

const TEST_PREFIX = 'storage-fetcher-directory';

describe('createDirectoryUrlsFetcher', () => {
  let client: SupabaseClient<unknown>;
  let dirName: string;
  let privateFiles: string[];
  let publicFiles: string[];

  beforeAll(async () => {
    dirName = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await Promise.all([
      cleanup(client, 'public_contact_files', dirName),
      cleanup(client, 'private_contact_files', dirName),
    ]);

    publicFiles = await upload(client, 'public_contact_files', dirName);
    privateFiles = await upload(client, 'private_contact_files', dirName);
  });

  afterAll(async () => {
    await Promise.all([
      cleanup(client, 'public_contact_files', dirName),
      cleanup(client, 'private_contact_files', dirName),
    ]);
  });

  it('should return files with urls for public bucket', async () => {
    await expect(
      createDirectoryUrlsFetcher('public')(
        client.storage.from('public_contact_files'),
        dirName,
      ),
    ).resolves.toEqual(
      expect.arrayContaining(
        publicFiles.map((f) =>
          expect.objectContaining({
            name: f,
            url: expect.stringContaining(
              `http://localhost:54321/storage/v1/object/public/public_contact_files/${dirName}/${f}`,
            ),
          }),
        ),
      ),
    );
  });

  it('should return files with urls for private bucket', async () => {
    await expect(
      createDirectoryUrlsFetcher('private')(
        client.storage.from('private_contact_files'),
        dirName,
      ),
    ).resolves.toEqual(
      expect.arrayContaining(
        privateFiles.map((f) =>
          expect.objectContaining({
            name: f,
            url: expect.stringContaining(
              `http://localhost:54321/storage/v1/object/sign/private_contact_files/${dirName}/${f}?token=`,
            ),
          }),
        ),
      ),
    );
  });
});
