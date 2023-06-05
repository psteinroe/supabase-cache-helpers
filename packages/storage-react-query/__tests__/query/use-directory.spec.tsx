import { screen } from '@testing-library/react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useDirectory } from '../../src';
import { cleanup, renderWithConfig, upload } from '../utils';

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
      process.env.SUPABASE_ANON_KEY as string
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
      const { data: files } = useDirectory(
        client.storage.from('private_contact_files'),
        dirName,
        {
          refetchOnWindowFocus: false,
        }
      );
      return (
        <div>
          {(files ?? []).map((f) => (
            <span key={f.name}>{f.name}</span>
          ))}
        </div>
      );
    }

    renderWithConfig(<Page />);
    await Promise.all(
      privateFiles.map(
        async (f) => await screen.findByText(f, {}, { timeout: 10000 })
      )
    );
  });
});
