import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetchDirectory } from '@supabase-cache-helpers/storage-core';
import { fireEvent, screen } from '@testing-library/react';
import 'ts-jest/globals';

import { cleanup, renderWithConfig, upload } from '../utils';
import Page from '../components/RemoveFilesPage.vue';

const TEST_PREFIX = 'postgrest-storage-remove';

describe('useRemoveFiles', () => {
  let client: SupabaseClient;
  let dirName: string;
  let files: string[];

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

    files = await upload(client, 'private_contact_files', dirName);
  });

  it('should remove files', async () => {
    renderWithConfig(Page, { client, dirName, files });
    fireEvent.click(screen.getByTestId('remove'));
    await screen.findByText('isSuccess: true', {}, { timeout: 10000 });
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName),
    ).resolves.toEqual([]);
  });
});
