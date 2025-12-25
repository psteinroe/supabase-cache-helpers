import { useFileUrl } from '../../src';
import { cleanup, renderWithConfig, upload } from '../utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { screen } from '@testing-library/react';
import { beforeAll, describe, it } from 'vitest';

const TEST_PREFIX = 'postgrest-storage-file-url';

describe('useFileUrl', () => {
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

  it('should return file url', async () => {
    function Page() {
      const { data: url } = useFileUrl(
        client.storage.from('public_contact_files'),
        `${dirName}/${publicFiles[0]}`,
        'public',
        {
          ensureExistence: true,
          refetchOnWindowFocus: false,
        },
      );
      return <div>{`URL: ${url ? 'exists' : url}`}</div>;
    }

    renderWithConfig(<Page />);
    await screen.findByText('URL: exists', {}, { timeout: 10000 });
  });
});
