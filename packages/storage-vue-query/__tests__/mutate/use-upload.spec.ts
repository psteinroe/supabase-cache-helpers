import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetchDirectory } from '@supabase-cache-helpers/storage-core';
import { fireEvent, screen } from '@testing-library/react';
import 'ts-jest/globals';

import { cleanup, loadFixtures, renderWithConfig } from '../utils';
import Page from '../components/UploadPage.vue';

const TEST_PREFIX = 'postgrest-storage-upload';

describe('useUpload', () => {
  let client: SupabaseClient;
  let dirName: string;
  let fileNames: string[];
  let files: File[];

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

    const fixtures = await loadFixtures();
    fileNames = fixtures.fileNames;
    files = fixtures.files;
  });

  it('should upload files', async () => {
    renderWithConfig(Page, { client, dirName, files });
    fireEvent.click(screen.getByTestId('upload'));
    await screen.findByText('isSuccess: true', {}, { timeout: 10000 });
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName),
    ).resolves.toEqual(
      expect.arrayContaining(
        files.map((f) => expect.objectContaining({ name: f.name })),
      ),
    );
  });
});
