import { fetchDirectory } from '@supabase-cache-helpers/storage-core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, screen } from '@testing-library/react';

import { useDirectory, useUpload } from '../../src';
import { cleanup, loadFixtures, renderWithConfig } from '../utils';

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
      process.env.SUPABASE_ANON_KEY as string
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
    function Page() {
      useDirectory(client.storage.from('private_contact_files'), dirName, {
        refetchOnWindowFocus: false,
      });
      const { mutateAsync: upload, isSuccess } = useUpload(
        client.storage.from('private_contact_files'),
        {}
      );
      return (
        <>
          <div
            data-testid="upload"
            onClick={() => upload({ files, path: dirName })}
          />
          <div>{`isSuccess: ${isSuccess}`}</div>
        </>
      );
    }

    renderWithConfig(<Page />);
    fireEvent.click(screen.getByTestId('upload'));
    await screen.findByText('isSuccess: true', {}, { timeout: 10000 });
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName)
    ).resolves.toEqual(
      expect.arrayContaining(
        files.map((f) => expect.objectContaining({ name: f.name }))
      )
    );
  });
});
