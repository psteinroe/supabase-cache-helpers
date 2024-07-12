import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { screen } from '@testing-library/react';
import type { Middleware } from 'swr';

import { useFileUrl } from '../../src';
import { cleanup, renderWithConfig, upload } from '../utils';

const TEST_PREFIX = 'postgrest-storage-file-url';

describe('useFileUrl', () => {
  let client: SupabaseClient;
  let provider: Map<any, any>;
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
  beforeEach(() => {
    provider = new Map();
  });

  it('should not fail for null key', async () => {
    function Page() {
      const { data: url, isValidating } = useFileUrl(
        client.storage.from('private_contact_files'),
        null,
        'private',
        {
          ensureExistence: true,
          revalidateOnFocus: false,
        },
      );
      return (
        <>
          <div>{`URL: ${url}`}</div>
          <div>{`isValidating: ${isValidating}`}</div>
        </>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('isValidating: false', {}, { timeout: 10000 });
  });

  it('should return file url', async () => {
    const mwMock = jest.fn();
    const mw: Middleware = (useSWRNext) => {
      return (key, fetcher, config) => {
        mwMock();
        const swr = useSWRNext(key, fetcher, config);
        return swr;
      };
    };
    function Page() {
      const { data: url } = useFileUrl(
        client.storage.from('public_contact_files'),
        `${dirName}/${publicFiles[0]}`,
        'public',
        {
          ensureExistence: true,
          revalidateOnFocus: false,
          use: [mw],
        },
      );
      return <div>{`URL: ${url ? 'exists' : url}`}</div>;
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('URL: exists', {}, { timeout: 10000 });
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith('storage')),
    ).toBeDefined();
    expect(mwMock).toHaveBeenCalled();
  });
});
