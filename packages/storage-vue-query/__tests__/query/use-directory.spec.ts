import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { screen } from '@testing-library/react';
import 'ts-jest/globals';

import { cleanup, renderWithConfig, upload } from '../utils';
import Page from '../components/DirectoryPage.vue';

const TEST_PREFIX = 'postgrest-storage-directory';

describe('useDirectory', () => {
  let client: SupabaseClient;
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

    privateFiles = await upload(client, 'private_contact_files', dirName);
    publicFiles = await upload(client, 'public_contact_files', dirName);
  });

  it('should return files', async () => {
    renderWithConfig(Page, { client, dirName });
    await Promise.all(
      privateFiles.map(
        async (f) => await screen.findByText(f, {}, { timeout: 10000 }),
      ),
    );
  });
});
