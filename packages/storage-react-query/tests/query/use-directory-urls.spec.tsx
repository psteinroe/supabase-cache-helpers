import { useDirectoryFileUrls } from '../../src';
import { cleanup, renderWithConfig, upload } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { screen } from '@testing-library/react';
import { beforeAll, describe, it } from 'vitest';

const TEST_PREFIX = 'postgrest-storage-directory-urls';

describe('useDirectoryFileUrls', () => {
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
    function Page() {
      const { data: files } = useDirectoryFileUrls(
        client.storage.from('private_contact_files'),
        dirName,
        'private',
        {
          refetchOnWindowFocus: false,
        },
      );
      return (
        <div>
          {(files ?? []).map((f) => (
            <span key={f.name}>{`${f.name}: ${f.url ? 'exists' : f.url}`}</span>
          ))}
        </div>
      );
    }

    renderWithConfig(<Page />);
    await Promise.all(
      privateFiles.map(
        async (f) =>
          await screen.findByText(`${f}: exists`, {}, { timeout: 10000 }),
      ),
    );
  });
});
