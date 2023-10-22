import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetchDirectory } from '@supabase-cache-helpers/storage-core';
import { fireEvent, screen } from '@testing-library/react';

import { useDirectory, useRemoveFiles } from '../../src';
import { cleanup, renderWithConfig, upload } from '../utils';

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
    function Page() {
      useDirectory(client.storage.from('private_contact_files'), dirName, {
        refetchOnWindowFocus: false,
      });
      const { mutateAsync: remove, isSuccess } = useRemoveFiles(
        client.storage.from('private_contact_files'),
      );
      return (
        <>
          <div
            data-testid="remove"
            onClick={() => remove(files.map((f) => [dirName, f].join('/')))}
          />
          <div>{`isSuccess: ${isSuccess}`}</div>
        </>
      );
    }

    renderWithConfig(<Page />);
    fireEvent.click(screen.getByTestId('remove'));
    await screen.findByText('isSuccess: true', {}, { timeout: 10000 });
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName),
    ).resolves.toEqual([]);
  });
});
